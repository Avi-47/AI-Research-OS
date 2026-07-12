# Research Report: Transformer Pruning Techniques

## Executive Summary
This report examines various pruning techniques applied to neural networks, with a specific focus on Transformer and Large Language Model (LLM) architectures. Key findings indicate a shift toward one-shot pruning methods (e.g., SparseGPT and Wanda) to avoid the prohibitive cost of retraining billion-scale models. Research suggests that traditional "oracle pruning" may be invalid for modern deep models due to poor correlation between performance before and after retraining. Additionally, new methods such as ROSE and Wanda++ enhance performance through reordering and regional gradients, while security research highlights a critical vulnerability where pruned models can be manipulated to exhibit malicious behaviors.

## Introduction
Pruning is a model compression technique used to reduce memory footprint and computational requirements (FLOPs) by removing unnecessary weights or structures. This is particularly critical for the deployment of Large Language Models (LLMs) and Vision Transformers (ViTs) on resource-constrained edge devices. Pruning methodologies generally range from unstructured weight removal to structured pruning of filters or channels, and from iterative processes like the Lottery Ticket Hypothesis (LTH) to one-shot methods that require no retraining.

## Findings

### One-Shot Pruning for Large Language Models
Recent advancements focus on reducing the computational overhead of pruning massive GPT-family models:
*   **SparseGPT:** This method allows for one-shot pruning of generative pretrained transformers to at least 50% sparsity without retraining. It can prune models like OPT-175B and BLOOM-176B in under 4.5 hours, achieving 60% unstructured sparsity with negligible perplexity increase. It is compatible with weight quantization and semi-structured patterns (2:4 and 4:8).
*   **ROSE (Reordered SparseGPT):** To address suboptimal performance caused by predefined left-to-right pruning orders in SparseGPT, ROSE employs a two-level reordering process. It identifies candidate weights and reorders columns and blocks based on estimated pruning loss, improving performance on LLaMA2, LLaMA3, and Mistral models.
*   **Wanda (Pruning by Weights and activations):** A straightforward approach that prunes weights based on the product of weight magnitude and corresponding input activations on a per-output basis. It requires no retraining or weight updates.
*   **Wanda++:** This framework utilizes decoder-block-level regional gradients and a regional optimization method to minimize output discrepancies between dense and sparse outputs, improving perplexity by up to 32% over the original Wanda.
*   **M-Wanda:** Specifically designed for multilingual LLMs, this method incorporates language-aware activation statistics and dynamically adjusts layerwise sparsity to mitigate the performance loss typically associated with sparsification in multilingual contexts.

### Structured and Unstructured Pruning
*   **Structured Pruning:** This approach produces more efficient models that map well to commodity hardware. Benchmarking via "PruningBench" has been introduced to standardize the evaluation of diverse structural pruning techniques across CNNs and ViTs.
*   **Filter and Channel Pruning:** Techniques such as CHIP use "Channel Independence" to measure correlations between feature maps; feature maps with less independence are pruned. For example, on ResNet-56 and ResNet-110, this approach reduced model size and FLOPs by over 40% while slightly increasing accuracy.
*   **Activation-based Pruning:** Research into Iterative Activation-based Pruning (IAP) and Adaptive Iterative Activation-based Pruning (AIAP) shows superior compression ratios (up to 15.88X on LeNet-5) compared to iterative L1-norm based pruning (ILP) with minimal accuracy loss.

### Weight-based and Magnitude Pruning
*   **LAMP (Layer-adaptive Magnitude-based Pruning):** To avoid handcrafted heuristics for layerwise sparsity, LAMP uses a rescaled version of weight magnitude that incorporates model-level $\ell_2$ distortion.
*   **The Oracle Pruning Critique:** Empirical analysis of 37K models (including ViT and MLLM) suggests that "oracle pruning"—selecting weights by minimizing pruned train loss—is largely invalid for modern deep models. The performance before retraining is barely correlated with performance after retraining, suggesting that task complexity renders traditional oracle criteria groundless.

### The Lottery Ticket Hypothesis (LTH) and Transformers
The LTH conjectures that neural networks contain small subnetworks ("winning tickets") that can train to full accuracy.
*   **Stabilization:** Research indicates that Iterative Magnitude Pruning (IMP) fails on deeper networks if pruning occurs at iteration 0. However, "stabilized" LTH, which prunes early in training (0.1% to 7% through), allows deeper networks (e.g., 80% sparsity on ResNet-50) to match original accuracy.
*   **Transformer Application:** Stabilized lottery ticket pruning on Transformer architectures for WMT 2014 translation tasks performs similarly to magnitude pruning up to 85% sparsity. Findings suggest that the initial sign of a parameter is more critical for successful training than its specific value.

### Knowledge Distillation (KD) and Dataset Pruning
*   **DistillLens:** A framework for LLM compression that aligns the "thought processes" of student and teacher models by projecting intermediate hidden states into vocabulary space via the Logit Lens.
*   **Dense Knowledge Distillation (DKD):** Used in continual learning to prevent catastrophic forgetting by partitioning output logits into dense groups and using an adaptive weighting scheme to balance new and old class learning.
*   **3D Dataset Pruning:** Pruning 3D data is challenging due to long-tail class distributions. Proposed solutions involve representation-aware subset selection with per-class retention quotas to balance Overall Accuracy (OA) and Mean Accuracy (mAcc).

### Security Implications
Recent research reveals a security gap in LLM pruning. Adversaries can compute a proxy metric to estimate which parameters are likely to be pruned. By injecting malicious behavior into parameters unlikely to be pruned and "repairing" the model with parameters likely to be pruned, the adversary can create a model that appears benign but becomes malicious after pruning (e.g., through Magnitude, Wanda, or SparseGPT pruning), with success rates up to 99.5% for targeted content injection.

## Comparative Analysis

| Technique | Primary Metric/Mechanism | Retraining Requirement | Key Advantage | Key Limitation |
| :--- | :--- | :--- | :--- | :--- |
| **SparseGPT** | Second-order gradients (Hessian) | One-shot (No) | Extremely fast (under 4.5h for 176B) | Suboptimal pruning order |
| **ROSE** | Reordered pruning loss | One-shot (No) | Better accuracy than SparseGPT | Complex reordering logic |
| **Wanda** | Weight $\times$ Activation | One-shot (No) | Computationally efficient; no updates | Accuracy degradation |
| **Wanda++** | Regional gradients | One-shot (No) | Significant perplexity improvement | Requires regional optimization |
| **LTH/IMP** | Magnitude (Iterative) | High (Iterative) | Finds "winning tickets" | Fails on deep networks at iteration 0 |
| **Oracle** | Minimized train loss | High (Retraining) | Long-standing foundation | Poor correlation on modern deep models |

## Conclusion
The evolution of transformer pruning is moving away from iterative, retraining-heavy methods toward one-shot, activation-aware, and gradient-aware techniques. While SparseGPT and Wanda provide scalable solutions for LLMs, the introduction of ROSE and Wanda++ demonstrates that refining the pruning order and utilizing regional gradients can further recover accuracy. However, the shift toward these efficient pruning methods introduces new security risks, as the predictable nature of pruning metrics can be exploited to hide malicious behaviors that only trigger after compression. Future development must account for the retraining stage in pruning criteria and incorporate security safeguards.

## References

- No sources available
