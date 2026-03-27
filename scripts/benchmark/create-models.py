#!/usr/bin/env python3
"""
create-models.py — Generate small ONNX models for the OARN benchmark loop.

Models produced:
  iris_classifier.onnx       — 4 float inputs → 3 class logits
  linear_regression.onnx     — 8 float inputs → 1 float output
  mnist_mini.onnx            — 784 float inputs → 10 class logits

Usage:
  pip install onnx numpy
  python3 scripts/benchmark/create-models.py
"""

import numpy as np
import onnx
from onnx import helper, TensorProto, numpy_helper
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(OUT_DIR, exist_ok=True)


def make_linear_model(name, input_size, output_size, filename):
    """Single dense layer: output = input @ W + b (no activation)."""
    rng = np.random.default_rng(42)
    W = rng.normal(0, 0.1, (input_size, output_size)).astype(np.float32)
    b = rng.normal(0, 0.01, (output_size,)).astype(np.float32)

    W_init = numpy_helper.from_array(W, name="W")
    b_init = numpy_helper.from_array(b, name="b")

    X = helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, input_size])
    Y = helper.make_tensor_value_info("output", TensorProto.FLOAT, [1, output_size])

    matmul = helper.make_node("MatMul", inputs=["input", "W"], outputs=["matmul_out"])
    add    = helper.make_node("Add",    inputs=["matmul_out", "b"], outputs=["output"])

    graph = helper.make_graph(
        [matmul, add],
        name,
        [X],
        [Y],
        initializer=[W_init, b_init],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)])
    model.doc_string = name
    onnx.checker.check_model(model)
    path = os.path.join(OUT_DIR, filename)
    onnx.save(model, path)
    print(f"  ✓ {filename}  ({input_size} → {output_size})")
    return path


def make_mlp_model(name, input_size, hidden_size, output_size, filename):
    """Two-layer MLP: input → ReLU hidden → output."""
    rng = np.random.default_rng(7)
    W1 = rng.normal(0, 0.05, (input_size, hidden_size)).astype(np.float32)
    b1 = np.zeros(hidden_size, dtype=np.float32)
    W2 = rng.normal(0, 0.05, (hidden_size, output_size)).astype(np.float32)
    b2 = np.zeros(output_size, dtype=np.float32)

    inits = [
        numpy_helper.from_array(W1, "W1"),
        numpy_helper.from_array(b1, "b1"),
        numpy_helper.from_array(W2, "W2"),
        numpy_helper.from_array(b2, "b2"),
    ]

    X = helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, input_size])
    Y = helper.make_tensor_value_info("output", TensorProto.FLOAT, [1, output_size])

    nodes = [
        helper.make_node("MatMul", ["input", "W1"], ["h1"]),
        helper.make_node("Add",    ["h1", "b1"],    ["h1b"]),
        helper.make_node("Relu",   ["h1b"],          ["h1r"]),
        helper.make_node("MatMul", ["h1r", "W2"],   ["h2"]),
        helper.make_node("Add",    ["h2", "b2"],    ["output"]),
    ]

    graph = helper.make_graph(nodes, name, [X], [Y], initializer=inits)
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)])
    model.doc_string = name
    onnx.checker.check_model(model)
    path = os.path.join(OUT_DIR, filename)
    onnx.save(model, path)
    print(f"  ✓ {filename}  ({input_size} → {hidden_size} → {output_size})")
    return path


if __name__ == "__main__":
    print("Generating ONNX benchmark models...")
    make_linear_model("iris_classifier",  4,   3,  "iris_classifier.onnx")
    make_linear_model("linear_regression", 8,  1,  "linear_regression.onnx")
    make_mlp_model("mnist_mini", 784, 64, 10,      "mnist_mini.onnx")
    print(f"\nModels written to {OUT_DIR}/")
    print("Next: run setup.js to upload to IPFS and build model-registry.json")
