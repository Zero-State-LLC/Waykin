from pathlib import Path
import os
import re
import subprocess
import unittest
import tempfile

ROOT = Path(__file__).resolve().parents[1]

class RecipeTests(unittest.TestCase):
    def test_build_pipeline_propagates_failure(self):
        for pack in ("skills", ".grok/skills"):
            text = (ROOT / pack / "waykin-build/SKILL.md").read_text()
            blocks = [b for b in re.findall(r"```bash\n(.*?)```", text, re.S) if "| tee" in b]
            self.assertEqual(len(blocks), 2)
            for block in blocks:
                with tempfile.TemporaryDirectory() as tmp:
                    fake = Path(tmp) / "xcodebuild"
                    fake.write_text("#!/bin/sh\nexit 23\n")
                    fake.chmod(0o755)
                    # Isolate the pipeline and its status-handling lines, not project generation/device discovery.
                    start = block.index("xcodebuild -scheme")
                    command = block[start:].replace("/tmp/waykin-build-", tmp + "/build-")
                    result = subprocess.run(["bash", "-c", command], env=dict(os.environ, PATH=tmp + ":" + os.environ["PATH"]), capture_output=True)
                    self.assertEqual(result.returncode, 23)
                    self.assertIn(b"build_exit=23", result.stdout)

    def test_shared_reference_ships_with_source_pack(self):
        self.assertTrue((ROOT / "skills/_shared/references/REPO_CONTEXT.md").is_file())
        for skill in (ROOT / "skills").glob("waykin-*"):
            self.assertTrue((skill / "references/REPO_CONTEXT.md").is_file(), str(skill))

    def test_device_recipe_does_not_call_build_install(self):
        for pack in ("skills", ".grok/skills"):
            text = (ROOT / pack / "waykin-device-testing/SKILL.md").read_text()
            self.assertNotIn("# Install Debug", text)
            self.assertIn("build-only", text)
            self.assertIn("install_exit", text)
            self.assertIn("launch_exit", text)

if __name__ == "__main__":
    unittest.main()
