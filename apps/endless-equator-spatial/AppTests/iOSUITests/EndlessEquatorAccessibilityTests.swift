import XCTest

final class EndlessEquatorAccessibilityTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testRiderLaunchAndAccessibilityAudit() throws {
        let app = XCUIApplication()
        app.launchArguments += [
            "--ui-testing",
            "-AppleLanguages", "(en)",
            "-AppleLocale", "en_US",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL"
        ]
        app.launch()

        XCTAssertTrue(
            app.navigationBars["Endless Equator"].waitForExistence(timeout: 30),
            "The rider navigation surface did not finish launching."
        )

        try app.performAccessibilityAudit()
    }

    @MainActor
    func testExtraExtraExtraLargeTextDoesNotBlockTheSafetyCard() throws {
        let app = XCUIApplication()
        app.launchArguments += [
            "--ui-testing",
            "-AppleLanguages", "(en)",
            "-AppleLocale", "en_US",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityExtraExtraExtraLarge"
        ]
        app.launch()

        XCTAssertTrue(app.staticTexts["PLANNING PREVIEW"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.buttons["Start verified guidance"].exists)
    }
}
