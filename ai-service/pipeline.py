# -*- coding: utf-8 -*-
"""Mashhoor campaign assistant — Colab pipeline (guardrail NN + optional Qwen LLM)."""
from __future__ import annotations

import os
import re
import logging
from typing import Any

import numpy as np

logging.getLogger("transformers").setLevel(logging.ERROR)
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

CAMPAIGN_SCHEMA = {
    "campaign_budget": "budget pay cost payout money cash fee compensation payment",
    "campaign_start_date": "start begin launch starting date timeline",
    "campaign_end_date": "end finish deadline conclude ending timeline",
    "target_region": "region location country city pakistan zone where geographic",
    "target_niche": "niche category content type audience vertical",
    "campaign_description": "description overview brief summary about product campaign",
    "influencer_task": "task deliverable role expected work requirements do content",
    "campaign_objective": "objective goal purpose metrics targets",
    "campaign_name": "campaign name title project",
}

PHRASE_PREFIXES = [
    "what is", "tell me about", "can you share", "i want to know",
    "please show the", "give me details on", "brief me regarding",
]

OUT_OF_SCOPE = [
    "write a python script", "who is the president", "capital city of spain",
    "how to cook", "cricket", "football", "weather today", "tell me a joke",
    "java programming", "global warming",
]


class MashhoorCampaignAssistant:
    def __init__(self) -> None:
        self.embed_model = None
        self.relevance_nn = None
        self.schema_vectors: dict[str, np.ndarray] = {}
        self.llm_pipeline = None
        self._ready = False

    def load(self) -> None:
        if self._ready:
            return

        from sentence_transformers import SentenceTransformer
        import tensorflow as tf

        self.embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

        X_phrases: list[str] = []
        y_labels: list[float] = []
        for _key, text in CAMPAIGN_SCHEMA.items():
            for w in text.split():
                for prefix in PHRASE_PREFIXES:
                    X_phrases.append(f"{prefix} {w}")
                    y_labels.append(1.0)
        for noise in OUT_OF_SCOPE:
            X_phrases.append(noise)
            y_labels.append(0.0)
            X_phrases.append(f"what is {noise}")
            y_labels.append(0.0)

        X_emb = self.embed_model.encode(X_phrases, convert_to_numpy=True)
        y_train = np.array(y_labels, dtype=np.float32)

        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation="relu", input_shape=(384,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation="relu"),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ])
        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["mae"])
        model.fit(X_emb, y_train, epochs=40, batch_size=32, verbose=0)
        self.relevance_nn = model

        self.schema_vectors = {
            k: self.embed_model.encode(v, convert_to_numpy=True)
            for k, v in CAMPAIGN_SCHEMA.items()
        }

        if os.getenv("MASHHOOR_USE_LLM", "false").lower() == "true":
            self._load_llm()

        self._ready = True

    def _load_llm(self) -> None:
        import torch
        import gc
        from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

        gc.collect()
        model_id = os.getenv("MASHHOOR_LLM_MODEL", "Qwen/Qwen2.5-3B-Instruct")
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        use_cuda = torch.cuda.is_available()
        llm_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if use_cuda else torch.float32,
            device_map="cuda" if use_cuda else "cpu",
            low_cpu_mem_usage=True,
        )
        self.llm_pipeline = pipeline(
            "text-generation",
            model=llm_model,
            tokenizer=tokenizer,
            device_map="cuda" if use_cuda else "cpu",
        )
        self.llm_pipeline.model.generation_config.max_length = None

    def _llm_generate(self, system: str, user: str, max_tokens: int = 120) -> str:
        if not self.llm_pipeline:
            return ""
        prompt = (
            f"<|im_start|>system\n{system}\n"
            f"<|im_start|>user\n{user}\n"
            f"<|im_start|>assistant\n"
        )
        out = self.llm_pipeline(
            prompt,
            max_new_tokens=max_tokens,
            do_sample=True,
            temperature=0.3,
            top_p=0.9,
        )
        text = out[0]["generated_text"][len(prompt) :].strip()
        return re.sub(r"^(assistant:|bot:)", "", text, flags=re.I).strip()

    def _cosine(self, a: np.ndarray, b: np.ndarray) -> float:
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def run(
        self,
        user_raw: str,
        chat_history: list[dict[str, str]],
        record: dict[str, Any],
    ) -> dict[str, str]:
        self.load()
        raw = user_raw.lower().strip()
        cleaned = re.sub(r"[?!.,#>]", "", raw).strip()
        name = record.get("campaign_name", "Campaign")

        if not cleaned:
            return {"reply": "Please type a valid question regarding the campaign metrics."}

        if cleaned in {"yes", "no", "ok", "okay", "sure", "thanks", "thank you", "great", "understood"}:
            return {
                "reply": "Understood. Please ask any more questions about the campaign budget, timeline, location, niche, or deliverables.",
            }

        user_vec = self.embed_model.encode(cleaned, convert_to_numpy=True)
        greet_vec = self.embed_model.encode("hi hello hey aoa greetings salam", convert_to_numpy=True)
        if self._cosine(user_vec, greet_vec) > 0.45 and len(cleaned.split()) <= 3:
            if self.llm_pipeline:
                sys_inst = (
                    f"You are the virtual manager for '{name}'. Greet professionally and "
                    "invite questions about budget, timeline, location, niche, or deliverables. "
                    "End with: Please ask if you have any question related to the campaign."
                )
                reply = self._llm_generate(sys_inst, f"The user said: {user_raw}")
                if reply:
                    return {"reply": reply}
            return {
                "reply": (
                    f"Hello! I'm your Mashhoor assistant for \"{name}\". "
                    "Ask me about budget, timeline, region, niche, or deliverables. "
                    "Please ask if you have any question related to the campaign."
                ),
            }

        rel_score = float(self.relevance_nn.predict(np.expand_dims(user_vec, 0), verbose=0)[0][0])
        matches = {
            k: self._cosine(user_vec, v) for k, v in self.schema_vectors.items()
        }
        top_field = max(matches, key=matches.get)
        top_sim = matches[top_field]

        if rel_score < 0.68 or top_sim < 0.22:
            if self.llm_pipeline:
                sys_inst = (
                    f"Campaign manager for '{name}'. User asked out-of-scope: '{user_raw}'. "
                    "Politely refuse; only discuss campaign data. "
                    "End with: Please ask if you have any question related to the campaign."
                )
                reply = self._llm_generate(sys_inst, "Generate refusal.")
                if reply:
                    return {"reply": reply, "trace": "Out-Of-Scope Guardrail Triggered"}
            return {
                "reply": (
                    f"I only answer questions about \"{name}\" — budget, timeline, location, niche, and deliverables. "
                    "Please ask if you have any question related to the campaign."
                ),
                "trace": "Out-Of-Scope Guardrail Triggered",
            }

        val = record.get(top_field, "")
        if not val or str(val).strip() in {"", "N/A"}:
            readable = top_field.replace("_", " ")
            return {
                "reply": f"I don't have the {readable} on file yet. Please ask if you have any question related to the campaign.",
                "trace": "Missing Data Gate Triggered",
            }

        facts: list[str] = []
        if any(w in cleaned for w in ["budget", "pay", "cost", "money", "fee"]):
            facts.append(f"Campaign Budget: {record.get('campaign_budget', '')}.")
        if any(w in cleaned for w in ["start", "begin", "launch"]):
            facts.append(f"Start Date: {record.get('campaign_start_date', '')}.")
        if any(w in cleaned for w in ["end", "finish", "deadline"]):
            facts.append(f"End Date: {record.get('campaign_end_date', '')}.")
        if any(w in cleaned for w in ["region", "location", "where", "country"]):
            facts.append(f"Target Region: {record.get('target_region', '')}.")
        if any(w in cleaned for w in ["niche", "category"]):
            facts.append(f"Niche: {record.get('target_niche', '')}.")
        if any(w in cleaned for w in ["task", "deliverable", "do", "expected", "role", "work"]):
            facts.append(f"Deliverables: {record.get('influencer_task', '')}.")
        if any(w in cleaned for w in ["objective", "goal", "purpose"]):
            obj = record.get("campaign_objective", "")
            if obj:
                facts.append(f"Objectives: {obj}.")
        if any(w in cleaned for w in ["about", "describe", "summary", "brief"]) or not facts:
            facts.append(f"Overview: {record.get('campaign_description', '')}.")

        facts_text = " ".join(facts)
        if self.llm_pipeline:
            hist = ""
            for turn in chat_history[-3:]:
                hist += f"Influencer: {turn.get('user', '')}\nAssistant: {turn.get('bot', '')}\n"
            sys_inst = (
                f"Brand manager for '{name}'. Answer ONLY using facts: {facts_text}\n{hist}"
                "End cleanly; no open-ended questions. Mention other campaign fields if useful."
            )
            reply = self._llm_generate(
                sys_inst,
                f"Influencer asks: '{user_raw}'. Short professional answer.",
                max_tokens=150,
            )
            if reply:
                return {"reply": reply, "trace": f"Matched: {top_field}"}

        return {
            "reply": f"{facts_text} Please ask if you have any question related to the campaign.",
            "trace": f"Matched: {top_field}",
        }


_assistant: MashhoorCampaignAssistant | None = None


def get_assistant() -> MashhoorCampaignAssistant:
    global _assistant
    if _assistant is None:
        _assistant = MashhoorCampaignAssistant()
    return _assistant
