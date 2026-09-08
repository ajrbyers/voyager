"""Regression tests for the packaged Jinja macros.

Every render goes through Django's Jinja2 backend with APP_DIRS=True,
so a passing suite also proves that an installed consumer resolves the
"voyager/components/..." import paths with no extra configuration.
"""

from pathlib import Path

from django.template import engines
from django.test import SimpleTestCase

import voyager

JINJA_ROOT = Path(voyager.__file__).parent / "jinja2"


def render(source, **context):
    """Render a Jinja template string through the Django Jinja2 backend."""
    return engines["jinja2"].from_string(source).render(context)


class TemplateCompilationTests(SimpleTestCase):
    def test_every_packaged_template_compiles(self):
        env = engines["jinja2"].env
        paths = sorted(
            p.relative_to(JINJA_ROOT).as_posix()
            for p in JINJA_ROOT.rglob("*.j2")
        )
        self.assertTrue(paths, "no packaged .j2 templates found")
        for path in paths:
            with self.subTest(template=path):
                env.get_template(path)


class ButtonMacroTests(SimpleTestCase):
    IMPORT = '{% from "voyager/components/button/button.j2" import button %}'

    def test_link_mode_renders_anchor_with_href(self):
        html = render(self.IMPORT + '{{ button("Open", href="/a/1") }}')
        self.assertIn('<a href="/a/1"', html)
        self.assertIn('class="btn"', html)

    def test_button_mode_disabled_renders_disabled_attribute(self):
        html = render(self.IMPORT + '{{ button("Save", disabled=True) }}')
        self.assertIn("<button", html)
        self.assertIn(" disabled", html)

    def test_link_mode_disabled_renders_inert_placeholder(self):
        html = render(
            self.IMPORT + '{{ button("Delete", href="/d/1", disabled=True) }}'
        )
        self.assertNotIn("href=", html)
        self.assertIn("is-disabled", html)
        self.assertIn('aria-disabled="true"', html)

    def test_attrs_render_on_both_modes(self):
        attrs = '{"hx-get": "/x/", "data-thing": "1"}'
        link = render(
            self.IMPORT + '{{ button("Go", href="/g/", attrs=' + attrs + ") }}"
        )
        btn = render(self.IMPORT + '{{ button("Go", attrs=' + attrs + ") }}")
        for html in (link, btn):
            self.assertIn('hx-get="/x/"', html)
            self.assertIn('data-thing="1"', html)


class FormMacroTests(SimpleTestCase):
    IMPORT = (
        '{% from "voyager/components/form/form.j2" import '
        "form_text, form_textarea, form_textarea_with_count, form_select, "
        "form_select_option, form_radios, form_radio, form_checkboxes, "
        "form_checkbox, form_date, form_password, form_file %}"
    )

    def test_text_error_state_links_message_via_describedby(self):
        html = render(
            self.IMPORT
            + '{{ form_text("n", "f", "Name", hint="A hint", error="Required") }}'
        )
        self.assertIn("form-group-error", html)
        self.assertIn("form-input-error", html)
        self.assertIn('id="f-hint"', html)
        self.assertIn('id="f-error"', html)
        self.assertIn('aria-describedby="f-hint f-error"', html)
        self.assertIn("Error:</span> Required", html)

    def test_text_disabled_readonly_and_attrs(self):
        html = render(
            self.IMPORT
            + '{{ form_text("n", "f", "Name", disabled=True, readonly=True,'
            ' attrs={"required": "required", "hx-post": "/save/"}) }}'
        )
        self.assertIn("disabled", html)
        self.assertIn("readonly", html)
        self.assertIn('required="required"', html)
        self.assertIn('hx-post="/save/"', html)

    def test_textarea_disabled_and_attrs(self):
        html = render(
            self.IMPORT
            + '{{ form_textarea("n", "f", "Notes", disabled=True,'
            ' attrs={"data-x": "1"}) }}'
        )
        self.assertIn("disabled", html)
        self.assertIn('data-x="1"', html)

    def test_textarea_with_count_contract(self):
        html = render(
            self.IMPORT
            + '{{ form_textarea_with_count("n", "f", "Summary", 200) }}'
        )
        self.assertIn('data-maxlength="200"', html)
        self.assertIn('maxlength="200"', html)
        self.assertIn('id="f-info"', html)
        self.assertIn("up to 200 characters", html)
        # The count message id must come first in aria-describedby.
        self.assertIn('aria-describedby="f-info"', html)

    def test_select_disabled_and_disabled_option(self):
        html = render(
            self.IMPORT
            + '{% call form_select("s", "s", "Section", disabled=True) %}'
            '{{ form_select_option("a", "Article", disabled=True) }}'
            "{% endcall %}"
        )
        self.assertIn("<select", html)
        self.assertIn(" disabled", html)
        self.assertIn('<option value="a" disabled>', html)

    def test_radios_fieldset_disabled_and_radio_attrs(self):
        html = render(
            self.IMPORT
            + '{% call form_radios("r", "Pick one", disabled=True) %}'
            '{{ form_radio("r", "y", "Yes", disabled=True,'
            ' attrs={"data-k": "v"}) }}'
            "{% endcall %}"
        )
        self.assertIn("<fieldset", html)
        self.assertIn(" disabled", html)
        self.assertIn('data-k="v"', html)

    def test_checkbox_disabled_and_attrs(self):
        html = render(
            self.IMPORT
            + '{% call form_checkboxes("c", "Options") %}'
            '{{ form_checkbox("c", "1", "One", disabled=True,'
            ' attrs={"hx-get": "/o/"}) }}'
            "{% endcall %}"
        )
        self.assertIn('type="checkbox"', html)
        self.assertIn(" disabled", html)
        self.assertIn('hx-get="/o/"', html)

    def test_password_disabled_also_disables_toggle(self):
        html = render(
            self.IMPORT + '{{ form_password("p", "p", "Password", disabled=True) }}'
        )
        self.assertEqual(html.count("disabled"), 2)

    def test_file_and_date_accept_disabled(self):
        file_html = render(
            self.IMPORT + '{{ form_file("f", "f", "Upload", disabled=True) }}'
        )
        date_html = render(
            self.IMPORT + '{{ form_date("d", "d", "Due date", disabled=True) }}'
        )
        self.assertIn("disabled", file_html)
        self.assertIn("<fieldset", date_html)
        self.assertIn(" disabled", date_html)

    def test_repeated_instances_do_not_bleed_state(self):
        html = render(
            self.IMPORT
            + '{{ form_text("a", "a", "A", error="Bad") }}'
            + '{{ form_text("b", "b", "B") }}'
        )
        self.assertEqual(html.count("form-group-error"), 1)
        self.assertIn('id="a-error"', html)
        self.assertNotIn('id="b-error"', html)


class TagPickerMacroTests(SimpleTestCase):
    IMPORT = (
        '{% from "voyager/components/tag-picker/tag-picker.j2" '
        "import tag_picker, tag_picker_results %}"
    )

    def test_widget_renders_chips_and_search(self):
        html = render(
            self.IMPORT
            + '{{ tag_picker(name="cats", label="category",'
            ' items=[{"name": "Astro", "remove_url": "/r/1/"}],'
            ' search_url="/s/") }}'
        )
        self.assertIn('id="tag-picker-cats"', html)
        self.assertIn('aria-label="Remove Astro"', html)
        self.assertIn('hx-post="/r/1/"', html)
        self.assertIn('hx-get="/s/"', html)

    def test_results_partial_escapes_query(self):
        html = render(
            self.IMPORT
            + '{{ tag_picker_results("cats", \'<script>\', results=[],'
            " add_url=\"/a/\", can_create=True) }}"
        )
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)
