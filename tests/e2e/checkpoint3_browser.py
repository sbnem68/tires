"""Manual Step 3 acceptance in Chromium. No live Wheel-Size requests are made."""
import os
from pathlib import Path
from urllib.parse import unquote_plus, urlparse

from checkpoint2_browser import WIZ_KEY, VIEWPORTS, Session, no_horizontal_scroll, tid
from playwright.sync_api import expect, sync_playwright


def check(browser, viewport, screenshots):
    session = Session(browser, viewport)
    page = session.page
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    session.wizard("city=ottawa&utm_source=cp3-first")
    original = session.original()
    assert original["utm_source"] == "cp3-first"
    page.get_by_test_id("postal-code-input").fill("K1A 0B1")
    page.get_by_test_id("travel-radius-select").select_option("25")
    page.get_by_test_id("continue-location").click()

    def choose(need):
        # Repair/changeover replace the radio list with their follow-up as soon as clicked.
        page.get_by_test_id(f"need-option-{need}").click()

    choose("buy_4")
    if screenshots:
        page.screenshot(path=screenshots / f"step-2-{viewport}.png", full_page=True)
    page.get_by_test_id("continue-need").click()
    expect(page.get_by_test_id("wizard-progress-label")).to_have_text("Step 3 of 6")
    expect(page.get_by_role("heading", name="What tire size do you need?")).to_be_focused()
    assert no_horizontal_scroll(page)
    size = page.get_by_role("textbox", name="Tire size")
    save = page.get_by_role("button", name="Save tire details")
    if screenshots:
        page.screenshot(path=screenshots / f"step-3-{viewport}.png", full_page=True)
    size.fill("205")
    save.click()
    expect(page.get_by_role("alert")).to_contain_text("Enter the full tire size")
    expect(size).to_be_focused()
    expect(size).to_have_value("205")
    size.fill(" 205 / 55 r16 ")
    save.click()
    expect(page.get_by_test_id("vehicle-saved")).to_contain_text("205/55R16")
    page.reload(wait_until="domcontentloaded")
    expect(page.get_by_test_id("vehicle-saved")).to_contain_text("No tire request has been submitted.")
    page.get_by_role("button", name="Edit tire details").click()
    expect(size).to_have_value("205/55R16")
    size.fill("225/65R17")
    page.get_by_label("Tire type", exact=True).select_option("Winter")
    page.get_by_label("Current tire condition").select_option("Worn")
    page.get_by_text("Add vehicle details", exact=False).click()
    for field, value in {"Make": "SyntheticQuasar", "Model": "TestModel", "Year": "2018", "Trim": "TestTrim"}.items():
        page.get_by_role("textbox", name=field, exact=True).fill(value)
    save.click()
    expected = {"tireSize": "225/65R17", "tireType": "Winter", "condition": "Worn",
                "make": "SyntheticQuasar", "model": "TestModel", "year": "2018", "trim": "TestTrim", "saved": True}
    assert session.store(WIZ_KEY)["state"]["vehicle"] == expected
    if screenshots:
        page.screenshot(path=screenshots / f"step-3-saved-{viewport}.png", full_page=True)
    page.get_by_test_id("wizard-back").click()
    choose("unsure")
    page.get_by_test_id("continue-need").click()
    page.get_by_role("button", name="Edit tire details").click()
    expect(page.get_by_text("Leave tire type set to Unknown.", exact=False)).to_be_visible()
    expect(size).to_have_value("225/65R17")
    page.get_by_test_id("wizard-back").click()
    choose("repair")
    page.get_by_test_id("issue-description").fill("Synthetic quartz tire repair")
    page.get_by_test_id("continue-need").click()
    expect(page.get_by_test_id("next-step-notice")).to_have_attribute("data-outcome", "repair_inspection")
    assert session.original() == original
    assert session.store(WIZ_KEY)["state"]["postalCode"] == "K1A 0B1"
    assert session.store(WIZ_KEY)["state"]["radius"] == "25"
    assert not errors, errors
    assert session.api_requests() and all(r["method"] == "GET" for r in session.api_requests())
    assert not page.evaluate("Boolean(window.rrweb)")
    for request in session.requests:
        assert "wheel-size.com" not in urlparse(request["url"]).netloc
        values = unquote_plus(request["url"] + request["body"])
        assert not any(value in values for value in (
            "SyntheticQuasar", "TestTrim", "225/65R17", "K1A 0B1", "Synthetic quartz tire repair", "recorder.js"
        )), request["url"]
    session.close()


if __name__ == "__main__":
    screenshots = Path(os.environ["T4T_CP3_SCREENSHOTS"]) if os.environ.get("T4T_CP3_SCREENSHOTS") else None
    if screenshots:
        screenshots.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for viewport in VIEWPORTS:
            check(browser, viewport, screenshots)
            print(f"PASS {viewport}: manual entry, validation, save/edit/refresh, navigation, attribution and network")
        browser.close()
