# CyberGua | 赛博算卦 ☯️🤖

> **该网页实现了春秋古筮法的赛博占卜，结合《周易》以及大语言模型进行个性化解读。**
> A cyber-divination platform reviving the ancient Spring and Autumn ritual, powered by I Ching wisdom and Large Language Models.

## 📖 项目简介 (Overview)

**CyberGua（大衍造物）** 是一个将东方古典玄学与现代前端交互技术深度融合的轻量化数字交互应用。

市面上的占卜应用多为简单的“随机数生成器”，缺乏起卦的仪式感与天人感应的参与感。本项目打破了这一常规，通过纯前端架构，不仅在视觉上重构了跨越三千年的“大衍筮法”（四营、三变、十八变），更在底层逻辑上严谨还原了古籍中的数理演算与占断法则。

这不仅仅是一个网页，而是一个属于数字时代的“赛博道场”。

## ✨ 核心亮点 (Key Features)

* **✋ 手势驱动的物理模拟 (Gesture-Driven Interaction)**
  摒弃传统的死板点击。引入类似“切开”的物理手势交互，用户在屏幕上划过一道“金色光刃”来切分 49 根数字蓍草。系统根据划线的真实物理比例计算左右分草数量，真正做到“不动不占，动则有应”。
  
* **🧮 严谨的古法占断 (Strict Algorithmic Divination)**
  内置完整 64 卦与 384 条爻辞的结构化数据。前端状态机严格按照古法计算得爻、成卦，并根据朱熹“变爻占断法则”自动精准定位本卦、变卦及核心释义原文。

* **🧠 大模型流式解卦 (AI-Powered Interpretation)**
  在传统典籍的基础上接入大语言模型（LLM）。系统会将算法锁定的《周易》原文、卦象数据与用户最初的提问（如“求学”、“决策”）一并组装为专属 Prompt。AI 将晦涩的古籍转化为兼具国学底蕴与现代视角的白话解答，并以打字机流式（Stream）输出，提供极具沉浸感的解卦体验。

* **⚡ 极致轻量化架构 (Lightweight & High Performance)**
  作为单人独立开发项目，采用去中心化的全前端架构（基于 Vue3 栈与 GSAP 动画引擎）。核心算法与物理模拟均在客户端本地完成，实现了零后端依赖、零延迟交互与极致的用户隐私保护。

## 🛠️ 技术支撑 (Tech Highlights)
* **Frontend:** Vue3, Element Plus
* **Animation Engine:** GSAP (GreenSock Animation Platform)
* **AI Integration:** LLM API via Server-Sent Events (SSE) streaming

---
*“一抹金光，一簇蓍草。在硅基与碳基的交汇处，解码古老的天机。”*