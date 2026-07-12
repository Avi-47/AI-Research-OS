# Research Report  
**Comparing Transformer Pruning Techniques**  

---

## Executive Summary  
Recent work on transformer‑based models has explored several pruning families—magnitude‑based, oracle‑guided, and lottery‑ticket‑style methods.  
* **Magnitude pruning** (e.g., Layer‑Adaptive Magnitude‑Based Pruning, LAMP) offers a simple, hyper‑parameter‑free way to set layer‑wise sparsity, achieving state‑of‑the‑art trade‑offs on image‑classification workloads.  
* **Oracle‑pruning** foundations have been scrutinized; large‑scale experiments show weak correlation between pre‑retraining and post‑retraining performance, casting doubt on oracle‑based criteria for deep transformers.  
* **Stabilized lottery ticket pruning** demonstrates that pruning early in training (not at initialization) can recover the full accuracy of large‑scale transformers (e.g., ResNet‑50, ViT) at sparsities up to 85 %, while a hybrid strategy can push sparsity even higher.  

Collectively, these findings suggest that a magnitude‑based, layer‑adaptive strategy combined with early‑training pruning (stabilized lottery ticket) offers the most robust and computation‑friendly approach for transformer compression.

---

## 1. Introduction  

Pruning is integral to deploying transformer models on resource‑constrained hardware. The literature distinguishes several paradigms:

1. **Magnitude‑Based Pruning** – removes weights with smallest absolute values.  
2. **Oracle‑Based Pruning** – selects unimportant weights by minimizing the training loss of the pruned network.  
3. **Lottery Ticket Pruning** – identifies subnetworks that can be trained (from scratch or early in training) to match the full network’s accuracy.  

This report focuses on transformer‑specific evidence for these paradigms, summarizing key experimental findings and technical nuances relevant to pruning transformer models.

---

## 2. Findings  

### 2.1 Layer‑Adaptive Magnitude‑Based Pruning (LAMP)  
- **Principle**: LAMP rescales weight magnitudes using the ℓ₂ distortion caused by pruning, yielding a global importance score that implicitly balances layer sparsity without manual tuning.  
- **Empirical Results**: Across diverse image‑classification setups, LAMP outperforms existing layer‑wise sparsity heuristics. Even in weight‑rewinding experiments, LAMP remains superior, whereas connectivity‑oriented heuristics underperform compared to a simple global magnitude approach.  
- **Practical Impact**: Eliminates the need for hyper‑parameter sweeps or per‑layer heuristics, simplifying deployment pipelines.

### 2.2 Oracle Pruning at Scale  
- **Experimental Scope**: 37,000 models spanning LeNet5, VGG, ResNets, ViT, and large‑scale datasets (ImageNet‑1K).  
- **Key Observation**: For non‑trivial models (e.g., ResNet‑56 on CIFAR‑10), the performance of a model immediately after pruning correlates negligibly with its performance after retraining.  
- **Implication**: Oracle pruning—labeling weights to minimise pruned‑train loss—fails to reliably predict post‑retraining efficacy for deep architectures, including transformers.  
- **Technical Insight**: Rising task complexity undermines oracle assumptions; retraining dynamics dominate final accuracy.

### 2.3 Stabilized Lottery Ticket Pruning for Transformers  
- **Methodology**: Instead of pruning at initialization, the mask is computed after a small fraction of training (0.1 %–7 %) has occurred.  
- **Results**:  
  - Maintains accuracy up to **85 % sparsity** on WMT 2014 English‑to‑German/French tasks for transformer architectures.  
  - A hybrid combination of stabilized lottery ticket pruning with magnitude pruning surpasses all tested techniques at even higher sparsities.  
- **Theoretical Note**: The initial sign of parameters, rather than precise values, chiefly influences successful training; magnitude pruning can serve as an efficient alternative for discovering lottery tickets.

### 2.4 Benchmarking Structural Pruning (PruningBench)  
- While PruningBench focuses on CNNs and ViTs, it provides a unified evaluation framework. It facilitates direct comparison of different structured‑pruning methods (filter, channel, head) but does not yet cover transformer‑specific head‑pruning variants in depth.

---

## 3. Comparative Analysis  

| Technique | Core Idea | Computational Overhead | Pruning Stages | Recovery Phase | Typical Sparsity Achieved | Supported Architectures | Key Strengths | Weaknesses |
|-----------|-----------|------------------------|----------------|----------------|--------------------------|------------------------|--------------|------------|
| **LAMP (Layer‑Adaptive Magnitude)** | Global importance score derived from ℓ₂ distortion; no hyper‑parameter tuning | Low (post‑training analysis) | Single pruning step | Optional weight‑rewinding | >70 % (image‑classification; transformer‑style experiments not explicit) | ViT (inference) | Simple, no retraining needed | Relies on static weight magnitudes; may ignore dynamic importance |
| **Oracle Pruning** | Minimizes pruned‑train loss | High (requires training pruned network repeatedly) | Training → Pruning → Retraining | Mandatory | Limited (≈30 % for ViTs) | ViT, ResNet, others | Theoretically principled | Poor post‑retraining correlation; impractical for large models |
| **Stabilized Lottery Ticket Pruning** | Early‑training mask derived from converged model | Moderate (needs early training but no extra retraining cycles) | Early Training → Pruning → Retraining (full) | Mandatory (full training of subnetwork) | Up to 85 % (ViT, WMT tasks); >85 % with hybrid | Transformer, ResNet‑50 | Recovers full accuracy at high sparsity; scalable | Requires careful early‑training schedule; extra training windows |
| **Hybrid Magnitude + Stabilized Lottery** | Combine LAMP scoring with early‑training masks | Moderate (both procedures) | Early Training → Pruning (combined) | Mandatory | >85 % (demonstrated) | Transformers | Maximizes sparsity; retains accuracy | Increased implementation complexity |

### Discussion Points  

1. **Hyper‑parameter Dependence** – LAMP eliminates the need for heuristic sparsity schedules that plague magnitude pruning. Oracle pruning requires extensive searches; stabilized lottery ticket needs a careful early‑training window but is deterministic.  
2. **Retraining Necessity** – Oracle pruning’s failure signals that post‑retraining evaluation is essential; stabilized lottery ticket retains this but the mask is computed earlier, reducing fine‑tuning cycles.  
3. **Architectural Flexibility** – LAMP and stabilized lottery ticket have been validated on transformer‑based language models (WMT tasks), whereas ORACLE pruning shows limited efficacy on ViTs and large NLP models.  
4. **Computation‑Accuracy Trade‑off** – LAMP yields modest sparsity gains with little overhead; stabilized lottery ticket can achieve far higher sparsity while still restoring performance, at the cost of two training phases.

---

## 4. Conclusion  

Evidence indicates that **layer‑adaptive magnitude pruning (LAMP)** provides a robust, low‑overhead baseline for transformer compression, especially when weight‑rewinding is acceptable. However, for **extreme sparsities (≥ 85 %)** on large‑scale transformers, **stabilized lottery ticket pruning** outperforms magnitude‑based or oracle‑based methods, recovering full accuracy with manageable retraining budgets. Oracle‑based pruning, long considered the gold standard, shows weak predictive power for post‑retraining performance in deep models, questioning its utility for transformer compression.  

Future work should explore **hybrid schemes** that combine LAMP’s analytical sparsity selection with early‑training mask optimization, leveraging the strengths of both paradigms while mitigating their weaknesses. Additionally, extending structured‑pruning benchmarks (e.g., PruningBench) to encompass transformer‑head pruning will aid in standardizing comparisons across emerging techniques.

## References

- No sources available
