class RuleEvaluator {
    evaluate({
        report = "",
        evidence = [],
        retrievedContext = {}
    } = {}) {
        const failedRules = [];
        const details = {};

        // Rule 1: Report should not be empty
        const hasReport =
            typeof report === "string" &&
            report.trim().length > 0;

        details.hasReport = hasReport;

        if (!hasReport) {
            failedRules.push("REPORT_EMPTY");
        }

        // Rule 2: Evidence should exist
        const hasEvidence =
            Array.isArray(evidence) &&
            evidence.length > 0;

        details.hasEvidence = hasEvidence;
        details.evidenceCount =
            Array.isArray(evidence)
                ? evidence.length
                : 0;

        if (!hasEvidence) {
            failedRules.push("NO_EVIDENCE");
        }

        // Rule 3: Report should have some meaningful length
        const minimumReportLength = 100;

        const hasMinimumLength =
            typeof report === "string" &&
            report.trim().length >= minimumReportLength;

        details.reportLength =
            typeof report === "string"
                ? report.trim().length
                : 0;

        details.hasMinimumLength =
            hasMinimumLength;

        if (!hasMinimumLength) {
            failedRules.push("REPORT_TOO_SHORT");
        }

        // Rule 4: Retrieved context check
        const semanticContext =
            retrievedContext?.semantic_context || [];

        const graphContext =
            retrievedContext?.graph_context || [];

        const hasContext =
            semanticContext.length > 0 ||
            graphContext.length > 0;

        details.semanticContextCount =
            semanticContext.length;

        details.graphContextCount =
            graphContext.length;

        details.hasContext = hasContext;

        if (!hasContext) {
            failedRules.push("NO_RETRIEVED_CONTEXT");
        }

        const totalRules = 4;
        const passedRules =
            totalRules - failedRules.length;

        const score =
            Math.round(
                (passedRules / totalRules) * 100
            );

        return {
            evaluator: "RULE",
            score,
            passed:
                failedRules.length === 0,
            failedRules,
            details
        };
    }
}

module.exports = RuleEvaluator;