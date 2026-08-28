class QualityDecisionEngine {
    constructor({
        passThreshold = 80,
        minimumGroundedness = 70,
        minimumTopicCoverage = 70
    } = {}) {
        this.passThreshold =
            passThreshold;

        this.minimumGroundedness =
            minimumGroundedness;

        this.minimumTopicCoverage =
            minimumTopicCoverage;
    }

    decide({
        overallScore,
        groundedness,
        topicCoverage,
        revisionAttempt = 0,
        maxRevisionAttempts = 1
    }) {

        const meetsThreshold = overallScore >= this.passThreshold;
        const groundedEnough = groundedness >= this.minimumGroundedness;
        const topicsCovered = topicCoverage >= this.minimumTopicCoverage;
        const passed = meetsThreshold && groundedEnough && topicsCovered;
        if (passed) {
            return {
                passed: true,
                decision: revisionAttempt > 0 ? "REVISED_PASS" : "PASS"
            };
        }

        if (
            revisionAttempt <
            maxRevisionAttempts
        ) {
            return {
                passed: false,
                decision: "REVISE"
            };
        }

        return {
            passed: false,
            decision:
                "BELOW_THRESHOLD"
        };
    }
}

module.exports = {
    QualityDecisionEngine
};