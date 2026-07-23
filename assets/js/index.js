// Voyager - single-entry behaviour bundle. Pages load only this file:
//   <script type="module" src=".../assets/js/index.js"></script>
// It mirrors index.css: one import per component with behaviour
// (alphabetical), then one explicit init call each. Importing a driver
// does nothing until its init runs.

import { detailsPersist } from "../../components/details/details.js";
import { navDisclosure } from "../../components/folder-list/folder-list.js";
import { passwordToggle } from "../../components/form/form.js";
import { modal } from "../../components/modal/modal.js";
import { themeToggle } from "../../components/theme-toggle/theme-toggle.js";

detailsPersist();
navDisclosure();
passwordToggle();
modal();
themeToggle();
