import type { AudioCue } from "./audioCue.js";
import type { SessionMemory } from "./companionIdentity.js";
import { CompanionRuntime } from "./companionRuntime.js";
import { cloneExperienceState, CompanionWalkExperience, makeExperienceContext,
  type ExperienceSessionState, type ExperienceResult, type TimeContext } from "./experience.js";
import { MovementEngine, type ActivityType, type MovementSession } from "./movementEngine.js";
import type { TimedWorldEvent } from "./experience.js";
import type { WorldEventKind } from "./worldState.js";

export type DemoScenarioID = "calmDayWalk";
export interface DemoScenario {
  id: DemoScenarioID; activity: ActivityType; experienceID: string; timeContext: TimeContext;
  ticks: { delta: number; speed: number }[]; expectedOutcome: string;
}
export interface SessionSummary {
  id: string; sessionID: string; activity: ActivityType; experience: string; variant: string;
  duration: number; activeTime: number; distanceMeters: number; averageSpeed: number;
  outcome: string; bondDelta: number; memory: SessionMemory;
  pathRelation: string | null; pathMetersAlongPath: number; activityCadenceBand: string | null;
}
export interface DemoEndResult {
  session: MovementSession | null; result: ExperienceResult | null; summary: SessionSummary | null;
}
export interface Coordinate { lat: number; lon: number }
export interface MapPresentationState {
  userCoordinate: Coordinate | null; route: Coordinate[];
  entities: { id: string; role: string; coordinate: Coordinate; relativeDistanceMeters: number | null }[];
  statusText: string;
}
const SEQUENCE: readonly WorldEventKind[] = ["companionObserves", "companionDrawsNear", "distantPresence",
  "pursuitBegins", "pursuitIntensifies", "pursuitFades", "bondMoment"];
function scenario(): DemoScenario {
  return { id: "calmDayWalk", activity: "walk", experienceID: "companion_walk", timeContext: "midday",
    ticks: SEQUENCE.map(() => ({ delta: 40, speed: 1.4 })), expectedOutcome: "COMPLETED" };
}
function emptyPresentation(statusText = ""): MapPresentationState {
  return { userCoordinate: null, route: [], entities: [], statusText };
}

/** No scheduler: the Lens driver owns real-time pacing; this owns the seven-tick arc. */
export class DemoSessionController {
  private scenarioValue: DemoScenario | null = null;
  private running = false;
  private paused = false;
  private tick = 0;
  private state: ExperienceSessionState | null = null;
  private runtime = new CompanionRuntime();
  private event: TimedWorldEvent | null = null;
  private cue: AudioCue | null = null;
  private presentation = emptyPresentation();

  constructor(readonly movementEngine: MovementEngine,
    private readonly identity: { now: () => number; newID: () => string }) {}

  get currentScenario(): DemoScenario | null {
    return this.scenarioValue ? { ...this.scenarioValue, ticks: this.scenarioValue.ticks.map(tick => ({ ...tick })) } : null;
  }
  get isRunning(): boolean { return this.running; }
  get isPaused(): boolean { return this.paused; }
  get tickIndex(): number { return this.tick; }
  get currentEvent(): TimedWorldEvent | null { return this.event ? { ...this.event } : null; }
  get currentAudioCue(): AudioCue | null { return this.cue ? { ...this.cue } : null; }
  get companionRuntime(): CompanionRuntime {
    const copy = new CompanionRuntime();
    copy.state = this.runtime.state;
    copy.relativeDistance = this.runtime.relativeDistance;
    return copy;
  }
  get companionWalkState() { return this.state ? cloneExperienceState(this.state).runtimeState?.value ?? null : null; }
  get presentationState(): MapPresentationState {
    return { ...this.presentation, userCoordinate: this.presentation.userCoordinate ? { ...this.presentation.userCoordinate } : null,
      route: this.presentation.route.map(point => ({ ...point })),
      entities: this.presentation.entities.map(entity => ({ ...entity, coordinate: { ...entity.coordinate } })) };
  }
  availableScenarios(): DemoScenario[] { return [scenario()]; }

  start(scenarioID: DemoScenarioID): void {
    if (scenarioID !== "calmDayWalk") return;
    const selected = scenario();
    this.scenarioValue = selected;
    this.tick = 0;
    this.running = true;
    this.paused = false;
    this.runtime = new CompanionRuntime();
    this.event = null;
    this.cue = null;
    // Preserve Swift's throwing order (including restart while a session is active).
    this.movementEngine.startSession(selected.activity, selected.experienceID);
    this.state = new CompanionWalkExperience().start(makeExperienceContext({ timeOfDay: selected.timeContext, activity: selected.activity }));
    this.updatePresentation();
  }
  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    try { this.movementEngine.pauseSession(); } catch { /* Swift try? */ }
  }
  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    try { this.movementEngine.resumeSession(); } catch { /* Swift try? */ }
  }
  advanceOneTick(): void {
    const selected = this.scenarioValue;
    if (!selected || !this.running || this.paused || this.tick >= selected.ticks.length) return;
    const { delta, speed } = selected.ticks[this.tick]!;
    this.movementEngine.simulate(delta, speed);
    if (this.state) {
      const points = this.movementEngine.currentSession?.routePoints;
      const timestamp = points?.[points.length - 1]?.timestamp ?? this.tick * delta;
      const update = new CompanionWalkExperience().updateForDemo(this.state,
        { timestamp, speed, distanceDelta: Math.max(0, speed * delta), isMoving: speed > 0.1 },
        makeExperienceContext({ timeOfDay: selected.timeContext, activity: selected.activity }), SEQUENCE[this.tick] ?? null);
      this.state = update.state;
      for (const command of update.companionCommands) this.runtime.applyCommand(command);
      const walk = update.state.runtimeState?.value;
      if (walk) {
        this.event = update.narrativeEvents.length === 0 ? null : walk.lastEvent;
        this.cue = walk.activeAudioCues[0] ?? null;
      }
      this.runtime.applyEvent(this.event);
    }
    this.tick += 1;
    this.updatePresentation();
  }
  runToEnd(): void {
    const selected = this.scenarioValue;
    // #25: user-approved Swift fix, paused runToEnd is a no-op.
    if (!selected || !this.running || this.paused) return;
    while (this.tick < selected.ticks.length) this.advanceOneTick();
  }
  end(): DemoEndResult {
    this.running = false;
    this.paused = false;
    const selected = this.scenarioValue;
    const empty: DemoEndResult = { session: null, result: null, summary: null };
    if (!selected) return empty;
    let session: MovementSession | null;
    try { session = this.movementEngine.endSession(); } catch { session = this.movementEngine.currentSession; }
    if (!session) return empty;
    const experience = new CompanionWalkExperience();
    const state = this.state ?? experience.start(makeExperienceContext({ timeOfDay: selected.timeContext, activity: selected.activity }));
    const result = experience.finish(state, session);
    const summary: SessionSummary = { id: this.identity.newID(), sessionID: session.id,
      activity: session.activityType, experience: selected.experienceID, variant: selected.timeContext,
      duration: session.elapsedTime, activeTime: session.activeTime, distanceMeters: session.distanceMeters,
      averageSpeed: session.averageSpeedMetersPerSecond, outcome: result.outcome, bondDelta: result.bondDelta,
      memory: { id: this.identity.newID(), sessionID: session.id, text: result.memoryText, timestamp: this.identity.now() },
      pathRelation: null, pathMetersAlongPath: 0, activityCadenceBand: null };
    this.scenarioValue = null;
    this.state = null;
    this.tick = 0;
    this.event = null;
    this.cue = null;
    this.presentation = emptyPresentation("Session complete");
    return { session, result, summary };
  }
  restart(): void {
    if (this.scenarioValue) this.start(this.scenarioValue.id);
  }
  private updatePresentation(): void {
    const session = this.movementEngine.currentSession;
    if (!session) return;
    const last = session.routePoints[session.routePoints.length - 1];
    const coordinate = last ? { lat: last.latitude, lon: last.longitude } : null;
    this.presentation = { userCoordinate: coordinate,
      route: session.routePoints.map(point => ({ lat: point.latitude, lon: point.longitude })),
      entities: coordinate ? [{ id: this.identity.newID(), role: "user", coordinate, relativeDistanceMeters: null }] : [],
      statusText: `Dist: ${Math.trunc(session.distanceMeters).toFixed(0)}m - Speed: ${session.currentSpeedMetersPerSecond.toFixed(1)} m/s - Lira: ${this.runtime.state}` };
  }
}
