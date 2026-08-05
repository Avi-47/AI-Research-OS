class RuleEvaluator {
    evaluate(report, retrievedContext = {}) {
        const failedRules = [];
        if (!this.hasReport(report)) {
            failedRules.push("REPORT_MISSING");
        }
        if (!this.hasMinimumLength(report)) {
            failedRules.push("MINIMUM_LENGTH");
        }
        if (!this.hasExecutiveSummary(report)) {
            failedRules.push("EXECUTIVE_SUMMARY");
        }
        if (!this.hasConclusion(report)) {
            failedRules.push("CONCLUSION");
        }
        if (!this.hasReferences(report)) {
            failedRules.push("REFERENCES");
        }
        if (!this.hasSemanticEvidence(retrievedContext)) {
            failedRules.push("SEMANTIC_EVIDENCE");
        }
        if (!this.hasGraphEvidence(retrievedContext)) {
            failedRules.push("GRAPH_EVIDENCE");
        }
        if (!this.hasNoDuplicateHeadings(report)) {
            failedRules.push("DUPLICATE_HEADINGS");
        }
        if (!this.hasNoEmptyHeadings(report)) {
            failedRules.push("EMPTY_HEADINGS");
        }
        return {
            passed: failedRules.length === 0,
            failedRules
        };
    }
    hasReport(report) {
        return typeof report === "string" && report.trim().length > 0;
    }
    hasMinimumLength(report) {
        if (!report) return false;
        return report.trim().length >= 1000;
    }
    hasExecutiveSummary(report) {
        if (!report) return false;
        return /executive summary/i.test(report);
    }
    hasConclusion(report) {
        if (!report) return false;
        return /conclusion/i.test(report);
    }
    hasReferences(report) {
        if (!report) return false;
        return /references/i.test(report);
    }
    hasSemanticEvidence(context) {
        return (
            Array.isArray(context.semantic_context) &&
            context.semantic_context.length > 0
        );
    }
    hasGraphEvidence(context) {
        return (
            Array.isArray(context.graph_context) &&
            context.graph_context.length > 0
        );
    }
    hasNoDuplicateHeadings(report) {
        if (!report) return false;
        const headings = report
            .split("\n")
            .filter(line => line.trim().startsWith("#"))
            .map(line => line.trim().toLowerCase());
        return new Set(headings).size === headings.length;
    }
    hasNoEmptyHeadings(report) {
        if (!report) return false;
        const headings = report
            .split("\n")
            .filter(line => line.trim().startsWith("#"));
        return headings.every(
            heading => heading.replace(/^#+/, "").trim().length > 0
        );
    }
}
module.exports = RuleEvaluator;