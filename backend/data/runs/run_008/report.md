# Research Report: Transformer Pruning Techniques

## Executive Summary
This report examines various pruning techniques applied to Transformer architectures and other deep learning models, focusing on structural, unstructured, and weight-magnitude approaches. Key findings include the emergence of one-shot pruning methods like SparseGPT and Wanda that eliminate the need for expensive retraining, the identification of specialized attention head pruning strategies, and the discovery of critical security vulnerabilities where pruned LLMs can be manipulated to exhibit malicious behaviors. Additionally, research into the "Lottery Ticket Hypothesis" suggests that pruning early in the training process can maintain model accuracy in deeper networks.

## Introduction
Pruning is a fundamental technique for reducing the memory footprint and computational costs of large-scale models, particularly Transformers and Large Language Models (LLMs). The goal is to remove redundant weights or structures while minimizing the loss of accuracy. Techniques vary from unstructured pruning (removing individual weights) to structured pruning (removing entire channels or heads), as well as specialized one-shot methods and knowledge distillation to preserve performance.

## Findings

### 1. One-Shot Pruning for Large Language Models (LLMs)
Recent advancements have focused on "one-shot" pruning to avoid the prohibitive cost of retraining billion-scale models.
*   **SparseGPT:** This method enables GPT-family models to be pruned to at least 50% sparsity in one-shot with minimal accuracy loss. It is compatible with weight quantization and semi-structured patterns (2:4 and 4:8). For example, it can prune OPT-175B and BLOOM-176B in under 4.5 hours, achieving 60% unstructured sparsity.
*   **ROSE:** A reordered version of SparseGPT that addresses suboptimal performance caused by predefined left-to-right pruning orders. ROSE prioritizes pruning weights with larger potential errors first, using a two-level reordering (columns within blocks and blocks themselves) based on estimated pruning loss.
*   **Wanda:** Prunes weights based on the product of weight magnitudes and corresponding input activations on a per-output basis. This approach requires no retraining or weight updates.
*   **Wanda++:** Enhances the Wanda framework by utilizing decoder-block-level regional gradients to minimize output discrepancies between dense and sparse decoder outputs, improving perplexity by up to 32% over original Wanda.
*   **M-Wanda:** Specifically addresses multilingual LLMs by incorporating language-aware activation statistics and dynamically adjusting layerwise sparsity based on cross-lingual importance.

### 2. Structured and Attention Head Pruning
Structured pruning focuses on removing entire architectural components for practical acceleration.
*   **Attention Head Pruning:** Removing unnecessary heads in multi-head attention. One approach applies layer-wise pruning to "All-attention Transformers" to reduce computation and parameters proportionally to the number of pruned heads.
*   **Specialized Head Functions:** Research has identified specific heads in GPT-2 and Pythia models that act as membership testers (Bloom filters) to determine if a token has appeared in the context.
*   **Diffusion Language Models (DLMs):** Unlike autoregressive LLMs where attention sinks are stable, DLMs exhibit higher variance in sink locations. **Sink-Aware Pruning** identifies and prunes these unstable sinks to achieve a better quality-efficiency trade-off without retraining.
*   **Channel Independence:** The CHIP method utilizes "Channel Independence" to measure correlations among feature maps, pruning filters with less independent feature maps to reduce model size and FLOPs (e.g., reducing ResNet-56 size by 42.8%).

### 3. Weight Magnitude and Sparsity Analysis
Magnitude-based pruning remains a standard but is being refined through new metrics and stability studies.
*   **LAMP (Layer-Adaptive Magnitude-based Pruning):** This method introduces a rescaled version of weight magnitude that incorporates model-level $\ell_2$ distortion, eliminating the need for handcrafted heuristics or hyperparameter searches for layerwise sparsity.
*   **Feature Geometry:** Analysis using Sparse Autoencoders (SAEs) on Gemma and Llama models reveals that rare features (low firing rates) survive magnitude and Wanda pruning better than frequent, generic features. Wanda is found to preserve feature structure up to 3.7x better than simple magnitude pruning.

### 4. The Lottery Ticket Hypothesis (LTH)
The LTH suggests that neural networks contain small subnetworks ("winning tickets") that can train to similar accuracy as the original network.
*   **Stabilized LTH:** Standard iterative magnitude pruning (IMP) often fails on deeper networks. Research suggests that pruning early in training (0.1% to 7% through) rather than at initialization allows deeper networks (e.g., ResNet-50 at 80% sparsity) to match the original accuracy.
*   **Transformer Application:** Stabilized lottery ticket pruning on Transformer architectures for translation tasks (WMT 2014) performs similarly to magnitude pruning up to 85% sparsity. The initial sign of the parameter is identified as the primary factor for successful training.

### 5. Knowledge Distillation (KD) and Dataset Pruning
*   **Knowledge Distillation:** Used to transfer knowledge from teacher models to smaller student models. Techniques include using triplet loss to increase similarity between teacher and student outputs, and **DistillLens**, which aligns the "thought processes" of models by projecting intermediate hidden states into vocabulary space via the Logit Lens.
*   **Dataset Pruning:** Specifically for 3D data, pruning focuses on approximating full-data expected risk using representation-aware subset selection and per-class retention quotas to handle long-tail class distributions.

### 6. Security Implications
Weight pruning introduces new security risks. Adversaries can construct "benign" models that exhibit malicious behaviors only after being pruned. This is achieved by injecting malicious behavior into parameters unlikely to be pruned and using parameters likely to be pruned to cancel out the behavior in the unpruned version. This attack has shown success rates up to 99.5% for targeted content injection across models using Magnitude, Wanda, and SparseGPT pruning.

## Comparative Analysis

| Technique | Retraining Required | Complexity/Cost | Primary Metric/Mechanism | Key Strength |
| :--- | :--- | :--- | :--- | :--- |
| **Magnitude Pruning** | Often | Low | Weight Magnitude | Simple, baseline for many methods |
| **SparseGPT** | No | Moderate | Second-order gradients (Hessian) | One-shot, high sparsity (60%) |
| **Wanda** | No | Low | Weight $\times$ Activations | Fast, no weight updates |
| **Wanda++** | No (orthogonal to FT) | Low | Regional Gradients | Better perplexity than Wanda |
| **ROSE** | No | Moderate | Reordered pruning loss | Fixes columnar pattern issues |
| **Stabilized LTH**| Yes (early) | Moderate | Iterative Magnitude Pruning | High sparsity in deep networks |

## Conclusion
Transformer pruning has shifted from iterative, retraining-heavy methods toward one-shot techniques like SparseGPT and Wanda, which are more viable for billion-scale models. While structural pruning and head-specific pruning offer efficiency gains, the validity of "Oracle pruning" (minimizing train loss) has been questioned, as performance before retraining is barely correlated with performance after retraining in modern deep models. Furthermore, the discovery of pruning-induced security vulnerabilities suggests that compression must now be balanced with security awareness.

## References

- No sources available
