"""Build hook that maps the shippable trees into the Django app.

assets/ and components/ stay where they are in the repo; at wheel-build
time each CSS and JS file is placed under voyager/static/voyager/ and
each Jinja2 macro under voyager/jinja2/voyager/. Both trees keep their
relative geometry, so the @import paths inside index.css and the
"voyager/components/..." template names resolve unchanged.

Editable installs skip the hook - the committed symlinks in
voyager/static/ and voyager/jinja2/ serve the same files from source.
"""

import os

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class VoyagerBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        if version == "editable":
            return
        force_include = build_data.setdefault("force_include", {})
        for tree in ("assets", "components"):
            for dirpath, _, filenames in os.walk(os.path.join(self.root, tree)):
                for filename in filenames:
                    source = os.path.join(dirpath, filename)
                    relative = os.path.relpath(source, self.root)
                    if filename.endswith((".css", ".js")):
                        target = os.path.join("voyager", "static", "voyager", relative)
                    elif filename.endswith(".j2"):
                        target = os.path.join("voyager", "jinja2", "voyager", relative)
                    else:
                        continue
                    force_include[source] = target
