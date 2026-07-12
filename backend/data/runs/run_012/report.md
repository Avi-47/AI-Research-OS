# Research Report: Comparison of Transformer and Neural Network Pruning Techniques

## Executive Summary
This report analyzes various pruning techniques applied to neural networks and Transformer-based architectures, including Large Language Models (LLMs) and Vision Transformers (ViTs). The analysis identifies a shift from traditional magnitude-based and "oracle" pruning toward more sophisticated one-shot, activation-aware, and stability-focused methods. Key findings indicate that traditional oracle pruning is largely invalid for modern deep models due to a lack of correlation between pre-retraining and post-retraining performance. Modern LLM pruning has evolved toward "one-shot" methods like SparseGPT and Wanda to avoid prohibitive retraining costs, while structured pruning seeks to improve hardware efficiency through activation-based and channel-independence metrics.

## Introduction
Pruning is a critical technique for reducing the memory footprint, storage, and computational requirements (FLOPs) of deep learning models. In the context of Transformer architectures and LLMs, the challenge is to maintain model performance (e.g., perplexity and accuracy) while achieving high sparsity. Pruning methodologies generally bifurcate into unstructured pruning (removing individual weights) and structured pruning (removing entire filters, channels, or layers). This report compares these approaches and evaluates the validity of traditional pruning criteria against modern alternatives.

## Findings

### 1. Weight-Based and Magnitude Pruning
*   **Magnitude-Based Pruning:** Simple magnitude-based pruning can achieve a strong tradeoff between sparsity and performance if layerwise sparsity is carefully chosen. The Layer-Adaptive Magnitude-based Pruning (LAMP) score improves this by rescaling weight magnitude to incorporate model-level $\ell_2$ distortion, eliminating the need for handcrafted heuristics.
*   **Oracle Pruning:** Traditionally, oracle pruning (minimizing pruned train loss) was the foundation for pruning for over 35 years. However, empirical evidence across 37,000 models (including ViT and MLLM) shows that on modern deep models, performance before retraining is barely correlated with performance after retraining. This suggests that oracle pruning criteria may be groundless for complex modern tasks.
*   **Security Vulnerabilities:** Weight-based pruning in LLMs (including Magnitude, Wanda, and SparseGPT) can be exploited. Adversaries can inject malicious behaviors into parameters unlikely to be pruned while using parameters likely to be pruned to cancel those behaviors in the unpruned model, creating a "benign" model that becomes malicious only after pruning.

### 2. One-Shot LLM Pruning Techniques
Because retraining billion-scale LLMs is often unaffordable, one-shot methods have emerged:
*   **SparseGPT:** A method designed for massive GPT-family models that can achieve at least 50% unstructured sparsity in one-shot without retraining. It is compatible with semi-structured patterns (2:4 and 4:8) and weight quantization.
    *   *ROSE (Reordered SparseGPT):* Improves upon SparseGPT by reordering the pruning order. Instead of a left-to-right order, ROSE prioritizes weights with larger potential pruning errors based on column and block pruning loss.
*   **Wanda (Pruning by Weights and activations):** Prunes weights based on the product of the smallest magnitudes and their corresponding input activations on a per-output basis.
    *   *Wanda++:* Enhances Wanda by using decoder-block-level regional gradients to minimize output discrepancies between dense and sparse outputs.
    *   *M-Wanda:* Adapts pruning for multilingual LLMs by incorporating language-aware activation statistics and adjusting layerwise sparsity based on cross-lingual importance.

### 3. Structured and Activation-Based Pruning
Structured pruning is prioritized for better hardware acceleration.
*   **Filter and Channel Pruning:** The CHIP (Channel Independence-based Pruning) method utilizes inter-channel correlations rather than intra-channel information. By pruning less independent feature maps, it reduces model size and FLOPs (e.g., reducing ResNet-56 size by 42.8% and FLOPs by 47.4% with an accuracy increase).
*   **Iterative Activation-based Pruning:** Iterative L1-norm based pruning (ILP) often fails to produce accurate models. In contrast, Iterative Activation-based Pruning (IAP) and Adaptive Iterative Activation-based Pruning (AIAP) achieve significantly higher compression (e.g., 15.88X on LeNet-5) with minimal accuracy loss (1%).
*   **Layer Pruning:** Removing layers induces magnitude gaps in hidden states. The Prune&Comp scheme mitigates this by rescaling remaining weights offline to eliminate the magnitude gap, which, when used iteratively, retains 93.19% of question-answering performance for LLaMA-3-8B when 5 layers are pruned.

### 4. The Lottery Ticket Hypothesis (LTH) and Stability
*   **Iterative Magnitude Pruning (IMP):** IMP is used to find "winning ticket" subnetworks. While IMP works on small tasks (MNIST), it often fails on deeper networks at initialization.
*   **Stabilized LTH:** Research suggests that pruning early in training (0.1% to 7% through) rather than at iteration 0 allows deeper networks (e.g., ResNet-50 at 80% sparsity) to match the accuracy of the original network.
*   **Transformer Application:** On Transformer architectures for translation tasks (WMT 2014), stabilized lottery ticket pruning performs similarly to magnitude pruning up to 85% sparsity. The initial sign of the parameter is found to be more critical for successful training than the specific value.

## Comparative Analysis

| Technique | Primary Metric | Retraining Required? | Structural Nature | Key Advantage | Key Limitation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Oracle Pruning** | Pruned Train Loss | Yes | Unstructured | Historical Standard | Invalid for modern deep models |
| **LAMP** | Rescaled Magnitude | No (Global) | Unstructured | No hyperparameter tuning | $\ell_2$ distortion focus |
| **SparseGPT** | Second-order gradients | No | Unstructured/Semi-structured | High sparsity (60%) in < 4.5 hrs | Predefined pruning order (fixed in ROSE) |
| **Wanda** | Weight $\times$ Activation | No | Unstructured | Simple, no weight updates | Baseline for newer regional gradient methods |
| **CHIP** | Channel Independence | No | Structured | Practical hardware acceleration | Focused on CNNs/ResNets |
| **IAP/AIAP** | Activations | Yes (Iterative) | Structured | Higher compression than weight-based | Requires iterative process |

## Conclusion
Pruning for Transformer and deep models has evolved from simple magnitude and loss-based metrics toward activation-aware and one-shot methods. The evidence demonstrates that for massive models, retraining is largely replaced by one-shot reconstruction (SparseGPT) or activation-based heuristics (Wanda). While structured pruning offers superior hardware efficiency, iterative activation-based approaches (IAP/AIAP) provide better accuracy than traditional iterative weight-based pruning. Finally, the "Stabilized LTH" indicates that the timing of pruning—specifically pruning early in training rather than at initialization—is vital for the success of sparsity in deeper architectures.

## References

- No sources available
