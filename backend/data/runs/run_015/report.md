# Transformer Pruning Techniques – A Comparative Review

## Executive Summary  
This report surveys the most influential transformer‑centric pruning research published in the supplied evidence. It focuses on five broad families that are directly applied to transformer models:  

| Family | Representative Methods | Core Idea | Strengths (reported) | Weaknesses (reported) |
|--------|------------------------|----------|---------------------|-----------------------|
| **Magnitude Pruning** | LAMP, Anchor–Context Graph Recovery (ACGR), Text‑Aware Token Cluster Selection (TATCS) | Layer‑wise magnitude **importance re‑scoring** | No hyper‑search, works with one‑shot pruning, stable on token‑pruned pipelines | Limited directly for large‑scale models; interacts poorly with retraining in some cases |
| **Structured Pruning** | PruningBench‑benchmark, Structured filter pruning (Channel Independence, CHIP) | Weight **filters / blocks** removal | Offers concrete acceleration on GPUs, high compression ratios | Requires careful design of mask; may negatively impact diverse downstream tasks |
| **Lottery Ticket‑Based** | Stabilized Lottery Ticket (early training), Lottery‑Ticket‑based Transformer (STP) | Early‑training iterative magnitude pruning | Finds winning sub‑networks at high sparsity (up to 85 %) on WMT translation | Temporal bottleneck: need to train to early epochs before pruning |
| **One‑Shot Sparse GPT‑style** | SparseGPT, ROSE, Wanda, Wanda++, M‑Wanda | Second‑order or activation‑aware magnitude pruning without retraining | Pruning 50–60 % sparsity on billion‑parameter models in a few hours; minimal accuracy loss | May depend on specific architecture or language family; some methods introduce re‑ordering overhead |
| **Knowledge‑Preserving Pruning** | K‑prune (structured, no‑retrain) | Preserve knowledge via iterative measurement & weight‑tuning | Significant F1 improvement on SQuAD even at 80 % sparsity | Implementation complex; targeted at encoder‑based language models |

All methods rely on a **single‑pass** (one‑shot) or a **very short‑term** pruning schedule, targeting inference‑time efficiency without the cost of full retraining.  

---

## Introduction  

Transformer architectures dominate natural language processing and, increasingly, multimodal and vision tasks. The steep inference cost of modern transformers (e.g., LLaMA‑2 70B, BLOOM‑176B) motivates research into aggressive sparsification techniques that either (1) remove many weights outright or (2) restructure the computation graph to admit efficient hardware execution. This report aggregates evidence from the supplied literature to contrast the landmark transformer pruning methods in terms of sparsity‑performance trade‑offs, computational overhead, and generality across tasks and architectures.  

---

## Findings  

### Magnitude‑Based Pruning  

| Study | Criterion | Quantitative Outcomes | Observations |
|-------|-----------|----------------------|--------------|
| **Layer‑Adaptive Magnitude Pruning (LAMP)** | Rescaled magnitude that incorporates L₂‑distortion | *Consistently outperforms* baselines on image classifiers (ResNet, ViT) | Requires **no hyper‑parameters**; robust to weight‑rewinding |
| **ACGR + TATCS (Token‑Pruning)** | Distribution‑consistency metric + dynamic token cluster selection | Retains 92.1 % of baseline LLaVA‑1.5‑7B performance with only 16 visual tokens | Preserves *feature distribution* and yields *stable* results at ultra‑low token budgets |

*Key insight*: Layer‑adaptive weighting of magnitudes improves upon global methods and preserves performance across early vs. late pruning schedules.

### Structured Pruning  

| Study | Scope | Superiority Metric | Caveats |
|-------|-------|------------------|---------|
| **PruningBench** | 16 methods across CNNs & ViTs | *Unified benchmark* reveals top performers vary by task | Still missing a consensus on a gold‑standard metric for transformers |
| **CHIP (Channel Independence)** | Filter pruning on ResNets & ImageNet | 40–45 % FLOP reduction with 0–0.15 % accuracy shift | Designed for CNNs; transfer to transformers unexplored in evidence |

*Key insight*: Structured pruning can reduce FLOPs dramatically, but concrete transformer‑level evaluations are sparse.

### Lottery Ticket‑Based Pruning  

| Study | Pruning Schedule | Sparsity Outcome | Accuracy Impact | Notes |
|-------|------------------|------------------|-----------------|-------|
| **Stabilized Lottery Ticket** | Early‑stage iterative magnitude pruning (0.1 %–7 %) | Up to 85 % sparsity on WMT translation | Comparable to magnitude pruning at lower sparsities | Finds *winning* sub‑networks via early‑stability criteria |
| **Early‑track IMP** (Implied in other papers) | Classic IMP at initialization | Fails on ResNet‑50 & image classification at high sparsity | Demonstrates limitation of pure init‑pruning for deep nets |

*Key insight*: Timing of pruning is critical; pruning after a modest amount of training dramatically increases the likelihood of retaining full accuracy.

### One‑Shot Sparse‑GPT‑style Pruning  

| Study | Method | Complexity | Sparsity & Accuracy | Remark |
|-------|--------|------------|---------------------|--------|
| **SparseGPT** | Second‑order Hessian‑guided weights | O(d³) → improved to O(d²⋅³⁰⁴) | 60 % unstructured sparsity *without* retraining on OPT‑175B/BLOOM‑176B | Enables pruning 100 B+ weights in < 4.5 h |
| **ROSE** | Reordered pruning on SparseGPT | Adds re‑ordering overhead | Outperforms SparseGPT on LLaMA variants | Re‑ordering mitigates column‑arising pruning gaps |
| **Wanda** | Magnitude × activation per‑output pruning | No retraining, simple score | Beats magnitude baseline on LLaMA & LLaMA‑2 | Activation‑aware weighting better captures importance |
| **Wanda++** | Adds *regional* gradients to Wanda | Fast (7B LLaMA in < 10 min) | Improves perplexity by up to 32 % over Wanda | Orthogonal to LoRA fine‑tuning; still one‑shot |

*Key insight*: Second‑order or activation‑aware one‑shot pruning can scale to billions of parameters while preserving performance, and re‑ordering approaches further tighten the accuracy gap.

### Knowledge‑Preserving Structured Pruning  

| Study | Approach | Result | Context |
|-------|----------|--------|---------|
| **K‑Prune** | Iterative pruning + knowledge‑preserving mask & weight tuning | 58 % F1 gain on SQuAD at 80 % sparsity (no retraining) | Strong for encoder‑based LMs where fine‑tuning is expensive |

*Key insight*: Maintaining knowledge through *targeted weighting* allows high sparsity without re‑training.

---

## Comparative Analysis  

| Criterion | Magnitude (LAMP, ACGR+TATCS) | Structured (PruningBench, CHIP) | Lottery Ticket (Stabilized) | One‑Shot Sparse‑GPT / Wanda | Knowledge‑Preserving (K‑Prune) |
|-----------|------------------------------|----------------------------------|------------------------------|------------------------------|--------------------------------|
| **Sparsity achieved** | 60‑80 % (depends on task) | 30‑45 % FLOP drop, ~40 % parameter drop | 80‑85 % (transl. tasks) | 50‑60 % (unstructured, 2:4 rows) | 80 % (actual parameters) |
| **Accuracy loss** | < 0.5 % on ViT, token‑pruning | < 1 % on ImageNet | ~1‑2 % on WMT | < 1 % perplexity growth on LLaMA-2 | > 58 % F1 gain (positive impact) |
| **Retraining requirement** | None (usually) | None (structured) | None (early training) | None | None |
| **Computational overhead** | Low (simple magnitude) | Medium (filter importance) | Medium (gradient-based early training) | High (Hessian or re‑ordering) | Medium (iterative masks) |
| **Hardware friendliness** | High (sparse kernels) | High (channel/block pruning) | Medium (requires early training) | High (structured sparsity) | Medium (custom masks) |
| **Scalability** | Proven up to ViT‑B | Demonstrated on CNNs, transformer adaptation unclear | Shown on 1‑2 B models (WMT) | Up to 175 B parameters | Demonstrated on encoder‑LM (BERT‑style) |

### Strengths
1. **Magnitude + Layer Adaptation (LAMP)** offers *parameter‑free* sparsity selection and works well across domains.
2. **Structured pruning** gives *hardware‑aligned* speedups due to contiguous memory access patterns.
3. **Lottery Ticket‑based early pruning** finds *winning* sub‑networks, allowing extreme sparsity with minimal loss.
4. **SparseGPT / Wanda** show that *second‑order* or *activation‑aware* scores can produce near‑ideal pruning without any fine‑tuning, critical for billion‑parameter LLMs.
5. **K‑Prune** demonstrates that preserving *knowledge* can turn high sparsity into *accuracy gains* for encoder‑based tasks.

### Weaknesses / Gaps
- The **oracle‑pruning** claim that correlation before and after retraining is weak; it undermines many supervised pruning methods and suggests that *post‑pruning retraining* still matters for performance stability.
- **Structured pruning literature** lacks transformer‑specific benchmarks; most evidence focuses on CNNs or generic NLP tasks.
- **One‑shot sparse‑GPT** has a high computational cost (Hessian or re‑ordering), which can offset the pruned model’s inferencing time for smaller or mid‑scale models.
- **Knowledge‑preserving pruning** is tailored to *encoder* networks; transformer encoders/decoders may need separate handling.

---

## Conclusion  

Transformer pruning research has converged on a handful of effective strategies:

1. **Magnitude‑based, layer‑adaptive** pruning (LAMP) remains a backbone for quick, hyper‑parameter‑free sparsity engineering.
2. **Early‑training LOTTERY‑ticket** methods can push sparsity into the 80 %+ regime while maintaining performance, but at the cost of an initial training phase.
3. **One‑shot sparse methods** (SparseGPT, Wanda, ROSE) enable billion‑parameter model compression **without retraining**, crucial for deployment constraints; their accuracy depends on the quality of *importance scores* and *re‑ordering*.
4. **Knowledge‑preserving structured pruning** (K‑Prune) is promising for *encoder*-centric tasks where fine‑tuning is not feasible.

Practitioners should weigh **hardware targets** (structured vs. unstructured sparsity), **available compute** for pre‑pruning training stages, and **task sensitivity** to freezing weights when selecting a pruning pipeline. Future datasets such as **PruningBench** may bridge the existing gaps by standardizing transformer‑specific benchmarks, enabling direct comparison of the above techniques under a unified protocol.

## References

- No sources available
