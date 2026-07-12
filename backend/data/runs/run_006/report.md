# Research Report  
**Topic:** Agent Architectures in Graph‑Based Retrieval‑Augmented Generation (GraphRAG)  

**Research Question:** How do recent GraphRAG systems design and coordinate their agent architectures to support dynamic, multi‑source retrieval and generation?

---

## Executive Summary

GraphRAG systems fuse large language or vision models with external knowledge represented as graphs or heterogeneous document collections.  Recent work demonstrates three prominent architectural patterns:

| Pattern | Core Idea | Representative Works |
|---------|-----------|----------------------|
| **Autoregressive Retrieval** | Retrieval is performed at each generation step, conditioning on already generated outputs. | **AR‑RAG** (image generation) |
| **Synchronous Knowledge Evolution** | Queries and knowledge bases co‑evolve, allowing models to adapt to continuously changing external sources. | **EVOR** (code generation) |
| **Self‑Play / Search‑Based Retrieval Ordering** | Retrieval is cast as an optimization problem (e.g., MCTS) that selects the most useful chunk sequence per query. | **CARROT** (document retrieval) |

All three share a multi‑agent or multi‑module structure that decouples **search (retrieval) agents** from **generation agents**, yet they differ in how they enforce **temporal coherence**, **knowledge freshness**, and **interaction efficiency**.  The evidence indicates that dynamic, context‑aware retrieval semantics are critical for achieving high generation fidelity across modalities.

---

## Introduction

Retrieval‑Augmented Generation (RAG) blends pretrained generative models with external knowledge to overcome hallucination, contextual drift, and knowledge gaps.  In *Graph*-based RAG, the knowledge source is organized as a graph or as multiple heterogeneous document repositories.  The growth in graph‑scale knowledge and the need for real‑time adaptation have prompted novel agent architectures that:

1. **Retrieve contextually** (e.g., patch‑level for images, token‑level for code).
2. **Evolve** the knowledge base alongside the query (e.g., libraries that update nightly).
3. **Optimize** the retrieval sequence via self‑play or search strategies.

This report surveys the supplied evidence to elucidate how these architectures are instantiated in practice.

---

## Findings

### 1. Autoregressive Retrieval‑Augmented Generation (AR‑RAG)

* **Architecture**: Two parallel decoding pipelines:
  * **DAiD (Distribution‑Augmentation in Decoding)** – merges predicted patch distribution with retrieved patch distribution **without** extra training.
  * **FAiD (Feature‑Augmentation in Decoding)** – smooths retrieved patch features with multi‑scale convolutions, then injects them into generation.

* **Dynamic Interaction**: At each decoding step, prior‑generated patches serve as retrieval queries, ensuring that the retrieved patches evolve with the growing image context. This mitigates *over‑copying* and *style drift* found in static image‑retrieval baselines.

* **Evaluation**: Significant performance gains reported on Midjourney‑30K, GenEval, and DPG‑Bench compared to state‑of‑the‑art image generation models.

### 2. Synchronous Evolution of Queries & Knowledge Bases (EVOR)

* **Architecture**: Multi‑agent pipeline where a **Query Agent** progressively refines its query while a **Knowledge Agent** updates its document corpus (e.g., library documentation, language specifications).

* **Key Contributions**:
  * **EVOR‑BENCH** datasets capture frequent library updates and long‑tail languages, highlighting the need for evolving knowledge bases.
  * **Synchronization**: As the query adapts, the knowledge base simultaneously augments or prunes documents, reducing hallucination on emerging libraries.
  * **Performance**: 2–4× execution accuracy over baselines (Reflexion, DocPrompting).

### 3. Self‑Play Optimization for Retrieval (CARROT)

* **Architecture**: A **Retrieval Planning Agent** deploys Monte Carlo Tree Search (MCTS) to determine the optimal **chunk combination and order** for a given query. A **Configuration Agent** predicts per‑query retrieval hyper‑parameters (budget, chunk length).

* **Core Innovations**:
  * **Chunk Correlation Modeling**: MCTS considers redundancy and ordering, overcoming the assumption of independent chunk relevance.
  * **Non‑Monotonic Utility**: Retrieval decisions are based on an estimated value rather than budget exhaustion.
  * **Self‑Play**: The agent explores different retrieval paths, resembling reinforcement learning but without explicit reward modeling.

* **Results**: Up to 30% improvement over baselines in document retrieval tasks.

### 4. Comparative Architectural Themes

| Theme | Observations |
|-------|--------------|
| **Decoding‑Time Retrieval** | AR‑RAG, FAiD demonstrate the feasibility of real‑time retrieval during generation. |
| **Knowledge Freshness** | EVOR uniquely synchronizes query evolution and knowledge updates, handling rapidly changing domains. |
| **Retrieval Order Optimization** | CARROT introduces search‑based optimization for chunk ordering, which could be ported to graph traversal in future GraphRAG systems. |
| **Agent Coordination** | All three systems employ multi‑module agents that decouple retrieval, planning, and generation, enabling modular scaling. |

---

## Comparative Analysis

| System | Retrieval Granularity | Update Strategy | Agent Interaction | Strength | Limitations |
|--------|-----------------------|-----------------|-------------------|----------|-------------|
| **AR‑RAG** | Patch‑level (image) | Static knowledge base (image patches) | One retrieval module per decoding step | Dynamic adaptation to visual context | Limited to vision; scaling to large vocabularies? |
| **EVOR** | Document/paragraph-level (code) | Continuous evolution of both query and KB | Parallel Query & Knowledge agents | Handles frequent library updates | Requires designing evolving KB pipelines |
| **CARROT** | Chunk‑level (text) | Fixed KB; search for order | Retrieval Planning + Configuration agents | Efficient optimization without RL | Relies on accurate chunk utility estimation |

**Insights**  
* *Granularity* is determined by the modality: patches for images, tokens/paragraphs for text/code.  
* *Evolvability* (EVOR) addresses dynamic uncertainty but adds system complexity.  
* *Optimization* (CARROT) trades off retrieval latency for higher relevance, suitable when query length is critical.

---

## Conclusion

The evidence delineates a clear evolutionary trajectory for GraphRAG agent architectures:

1. **From static retrieval to autoregressive, context‑aware retrieval** (AR‑RAG).  
2. **From static to dynamic, co‑evolving knowledge bases** (EVOR).  
3. **From greedy retrieval to search‑based, self‑play optimization** (CARROT).  

Each architectural choice reflects a different tension between **temporal fidelity**, **knowledge freshness**, and **retrieval efficiency**.  Future GraphRAG designs are likely to integrate these ideas—composing autoregressive retrieval agents that can self‑play over evolving graph neighborhoods—thereby achieving robust, high‑quality generation across modalities.

## References

- No sources available
