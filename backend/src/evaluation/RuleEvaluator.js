class RuleEvaluator {
    evaluate({
        report = "",
        evidence = [],
        retrievedContext = {},
        topics = []
    } = {}) {
        const failedRules = [];
        const details = {};

        const normalizedReport =
            typeof report === "string"
                ? report.trim()
                : "";

        /*
        ========================================
        RULE 1: REPORT EXISTS
        ========================================
        */

        const hasReport =
            normalizedReport.length > 0;

        details.hasReport = hasReport;

        if (!hasReport) {
            failedRules.push("REPORT_EMPTY");
        }

        /*
        ========================================
        RULE 2: MINIMUM LENGTH
        ========================================
        */

        const minimumReportLength = 300;

        const hasMinimumLength =
            normalizedReport.length >=
            minimumReportLength;

        details.reportLength =
            normalizedReport.length;

        details.minimumReportLength =
            minimumReportLength;

        details.hasMinimumLength =
            hasMinimumLength;

        if (!hasMinimumLength) {
            failedRules.push(
                "REPORT_TOO_SHORT"
            );
        }

        /*
        ========================================
        RULE 3: EVIDENCE EXISTS
        ========================================
        */

        const evidenceCount =
            Array.isArray(evidence)
                ? evidence.length
                : 0;

        const hasEvidence =
            evidenceCount > 0;

        details.evidenceCount =
            evidenceCount;

        details.hasEvidence =
            hasEvidence;

        if (!hasEvidence) {
            failedRules.push(
                "NO_EVIDENCE"
            );
        }

        /*
        ========================================
        RULE 4: RETRIEVED CONTEXT EXISTS
        ========================================
        */

        const semanticContext =
            Array.isArray(
                retrievedContext?.semantic_context
            )
                ? retrievedContext.semantic_context
                : [];

        const graphContext =
            Array.isArray(
                retrievedContext?.graph_context
            )
                ? retrievedContext.graph_context
                : [];

        const hasContext =
            semanticContext.length > 0 ||
            graphContext.length > 0;

        details.semanticContextCount =
            semanticContext.length;

        details.graphContextCount =
            graphContext.length;

        details.hasContext =
            hasContext;

        if (!hasContext) {
            failedRules.push(
                "NO_RETRIEVED_CONTEXT"
            );
        }

        /*
        ========================================
        RULE 5: REQUIRED SECTIONS
        ========================================
        */

        const requiredSections = [
            "executive summary",
            "introduction",
            "findings",
            "conclusion"
        ];

        const reportLower =
            normalizedReport.toLowerCase();

        const sectionResults =
            requiredSections.map(section => ({
                section,
                present:
                    reportLower.includes(section)
            }));

        const missingSections =
            sectionResults
                .filter(item => !item.present)
                .map(item => item.section);

        details.sections =
            sectionResults;

        details.missingSections =
            missingSections;

        if (missingSections.length > 0) {
            failedRules.push(
                "MISSING_REQUIRED_SECTIONS"
            );
        }

        /*
        ========================================
        RULE 6: TOPIC COVERAGE
        ========================================
        */

        const normalizedTopics =
            Array.isArray(topics)
                ? topics
                    .map(topic => {
                        if (
                            typeof topic ===
                            "string"
                        ) {
                            return topic;
                        }

                        return (
                            topic?.name ||
                            topic?.topic ||
                            topic?.title ||
                            null
                        );
                    })
                    .filter(Boolean)
                : [];

        const topicResults =
            normalizedTopics.map(topic => ({
                topic,
                covered:
                    reportLower.includes(
                        topic.toLowerCase()
                    )
            }));
        const coveredTopics = topicResults.filter(item => item.covered).length;
        const topicCoverage = normalizedTopics.length > 0 ? Math.round((coveredTopics / normalizedTopics.length) * 100): 100;
        details.topicResults = topicResults;
        details.topicCoverage = topicCoverage;
        if (normalizedTopics.length > 0 && topicCoverage < 70) {
            failedRules.push("INSUFFICIENT_TOPIC_COVERAGE");
        }
        /*
        ========================================
        STRUCTURE SCORE
        ========================================
        */
        const structureChecks = [
            hasReport,
            hasMinimumLength,
            missingSections.length === 0
        ];
        const structure = Math.round((structureChecks.filter(Boolean).length / structureChecks.length) * 100);
        /*
        ========================================
        OVERALL RULE SCORE
        ========================================
        */
        const ruleChecks = [
            hasReport,
            hasMinimumLength,
            hasEvidence,
            hasContext,
            missingSections.length === 0,
            topicCoverage >= 70
        ];

        const score = Math.round((ruleChecks.filter(Boolean).length / ruleChecks.length) * 100);
        return {
            evaluator: "RULE",
            score,
            structure,
            topicCoverage,
            passed: failedRules.length === 0,
            failedRules,
            details
        };
    }
}

module.exports = RuleEvaluator;