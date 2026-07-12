# Research Report: Comparison of Transformer Pruning Techniques

## Executive Summary
Pruning techniques for Transformers and Large Language Models (LLMs) have evolved from traditional iterative magnitude-based methods to one-shot, activation-aware, and structural approaches. Key findings indicate that while iterative magnitude pruning (IMP) faces scaling bottlenecks in large models, one-shot methods like SparseGPT and Wanda offer efficient alternatives. Recent research highlights the importance of activation sparsity, suggesting that Transformer MLP layers are naturally sparse, which can be leveraged for significant memory and FLOP reductions. Furthermore, the validity of "Oracle Pruning" has been questioned, as pre-retraining performance shows negligible correlation with post-retraining performance in models of nontrivial size.

## Introduction
Pruning aims to reduce the computational and memory footprints of neural networks by removing redundant weights or structures. In the context of Transformers and LLMs, the goal is to maintain performance (accuracy or perplexity) while achieving high levels of sparsity. Pruning methodologies can be broadly categorized into weight-based sparsity (magnitude and structured), activation-based sparsity, and lottery ticket-based approaches. This report compares these techniques, focusing on their efficacy, computational costs, and applicability to large-scale generative models.

## Findings

### Weight-Based and Magnitude Pruning
*   **Magnitude-Based Pruning:** Simple magnitude pruning can achieve a state-of-the-art tradeoff between sparsity and performance if layerwise sparsity is carefully chosen. The Layer-Adaptive Magnitude-based Pruning (LAMP) score improves this by using a rescaled weight magnitude that incorporates model-level $\ell_2$ distortion, eliminating the need for hyperparameter tuning.
*   **One-Shot Pruning for LLMs:** 
    *   **SparseGPT:** Demonstrates that GPT-family models (e.g., OPT-175B, BLOOM-176B) can be pruned to 60% unstructured sparsity in one-shot without retraining. It utilizes second-order gradients (Hessian).
    *   **ROSE:** Improves upon SparseGPT by reordering the pruning sequence. It prioritizes weights with larger potential pruning errors to address suboptimal performance caused by columnar patterns in weights.
    *   **Wanda:** Prunes weights based on the product of weight magnitudes and corresponding input activations. It outperforms standard magnitude pruning and remains competitive with weight-update methods without requiring retraining.
    *   **Wanda++:** Enhances Wanda by utilizing decoder-block-level regional gradients and regional optimization to minimize output discrepancies between dense and sparse outputs, improving perplexity by up to 32% over the original Wanda.
    *   **M-Wanda:** Adapts pruning for multilingual LLMs by incorporating language-aware activation statistics and dynamically adjusting layerwise sparsity to preserve multilinguality.
*   **Essential Sparsity:** Research indicates the existence of "essential sparsity" in large pre-trained transformers, characterized by a sharp dropping point where performance declines rapidly. This property holds for N:M patterns and is more pronounced in models trained with self-supervised learning (SSL) objectives compared to supervised learning (SL).

### Structural and Unstructured Pruning
*   **Structural Pruning:** Focuses on removing entire structures (e.g., filters). **CHIP (Channel Independence-based Pruning)** utilizes inter-channel correlations rather than intra-channel information. On ResNet-56 and ResNet-110, it achieved accuracy increases of 0.90% and 0.94% respectively, while reducing model size and FLOPs by approximately 42-52%.
*   **Unstructured Pruning:** Removes individual weights. SparseGPT is a primary example of efficient unstructured pruning for massive models.
*   **Oracle Pruning:** A foundational method that selects weights by minimizing pruned train loss. However, empirical analysis across 37K models (including ViT and MLLM) reveals that pre-retraining performance is negligibly correlated with post-retraining performance for models of nontrivial size (e.g., ResNet56 on CIFAR-10), suggesting the foundational premise of oracle pruning may be questionable due to rising task complexity.

### Activation-Based Sparsity
*   **Natural Emergence:** Transformer activation maps (intermediate outputs of MLPs after ReLU) are naturally sparse. For example, T5-Base shows 3.0% and ViT-B16 shows 6.3% nonzero entries. Sparsity increases as models become larger and wider.
*   **Forced Sparsity:** Enforcing higher sparsity via Top-k thresholding can improve robustness to input corruptions, reduce sensitivity to noisy training data, and improve prediction confidence calibration.
*   **Edge Deployment:** Utilizing activation sparsity can achieve ~50% reduction in main memory and computing for FFN components with negligible accuracy degradation by omitting inactive weights during prediction.

### Lottery Ticket Hypothesis (LTH)
*   **Stabilized LTH:** Traditional IMP often fails on deeper networks. The "Stabilized LTH" proposes pruning after a few training iterations (0.1% to 7%) rather than at iteration 0.
*   **Transformer Application:** In Transformer architectures (WMT 2014 tasks), stabilized lottery ticket pruning performs similarly to magnitude pruning up to 85% sparsity. Evidence suggests the initial sign of parameters is more critical than the specific value for successful training.

## Comparative Analysis

| Technique | Driver/Metric | Retraining Required | Computational Cost | Key Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **Magnitude Pruning (LAMP)** | Rescaled weight magnitude | Often (Weight-rewinding) | Low | No hyperparameter tuning |
| **SparseGPT** | Second-order gradients | No (One-shot) | Moderate | Very high sparsity (60%) in LLMs |
| **Wanda / Wanda++** | Weight $\times$ Activation / Regional Gradients | No | Low | Extremely fast (e.g., 7B model in <10 min) |
| **CHIP** | Channel Independence | Not Specified | Moderate | Practical acceleration via filter removal |
| **Stabilized LTH** | Convergence mask | Yes (Retraining) | High (IMP routine) | Finds "winning tickets" early in training |
| **Activation Sparsity**| ReLU/Thresholding | No/Tuning | Very Low | Memory/FLOP reduction at inference |

### Key Trade-offs
1.  **Retraining vs. One-Shot:** Traditional methods (LTH, Oracle) rely on iterative train-prune-retrain cycles, which are computationally prohibitive for billion-scale LLMs. One-shot methods (SparseGPT, Wanda) solve this but may have lower accuracy ceilings than fine-tuned sparse models.
2.  **Weight-only vs. Activation-aware:** Standard magnitude pruning ignores the input data. Activation-aware methods (Wanda, M-Wanda) incorporate the input's influence, leading to better performance preservation in LLMs.
3.  **Unstructured vs. Structured:** Unstructured pruning (SparseGPT) can remove more weights (up to 100B+ weights) but requires specialized hardware/software for speedup, whereas structured pruning (CHIP) provides immediate practical acceleration.

## Conclusion
Transformer pruning is shifting away from iterative, magnitude-only approaches toward one-shot, activation-aware, and structurally-informed methods. While magnitude pruning remains a strong baseline, the emergence of "essential sparsity" and "activation sparsity" provides new avenues for efficiency. One-shot methods like SparseGPT and Wanda are critical for the deployment of massive LLMs where retraining is unaffordable. Furthermore, the finding that pre-retraining performance poorly predicts post-retraining performance highlights a critical need to account for the retraining stage when developing new pruning criteria.

## References

- No sources available
