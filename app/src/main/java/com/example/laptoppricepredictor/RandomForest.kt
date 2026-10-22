package com.example.laptoppricepredictor

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * On-device inference for a scikit-learn RandomForestRegressor exported by ml/train.py.
 * Prediction = mean of the leaf values reached in every tree (same as sklearn).
 * Feature order and option lists come from the model file, so training and app encoding match.
 */
class RandomForest private constructor(
    val features: List<String>,
    val options: Map<String, List<String>>,
    private val trees: List<Tree>
) {
    private class Tree(
        val f: IntArray, val t: DoubleArray, val l: IntArray, val r: IntArray, val v: DoubleArray
    )

    /** Encode a form selection (option label per feature, plus age in years) into the model's feature vector. */
    fun encode(selection: Map<String, String>, age: Int): DoubleArray =
        DoubleArray(features.size) { i ->
            val name = features[i]
            if (name == "age") age.toDouble()
            else {
                val idx = options.getValue(name).indexOf(selection[name])
                require(idx >= 0) { "Invalid value for $name" }
                idx.toDouble()
            }
        }

    fun predict(x: DoubleArray): Double {
        var sum = 0.0
        for (tr in trees) {
            var n = 0
            while (tr.f[n] >= 0) n = if (x[tr.f[n]] <= tr.t[n]) tr.l[n] else tr.r[n]
            sum += tr.v[n]
        }
        return sum / trees.size
    }

    companion object {
        fun load(context: Context): RandomForest {
            val root = JSONObject(context.assets.open("rf_model.json").bufferedReader().use { it.readText() })
            val features = root.getJSONArray("features").let { a -> List(a.length()) { a.getString(it) } }
            val optObj = root.getJSONObject("options")
            val options = optObj.keys().asSequence().associateWith { k ->
                optObj.getJSONArray(k).let { a -> List(a.length()) { a.getString(it) } }
            }
            val ta = root.getJSONArray("trees")
            val trees = List(ta.length()) { i ->
                val o = ta.getJSONObject(i)
                Tree(ints(o.getJSONArray("f")), doubles(o.getJSONArray("t")), ints(o.getJSONArray("l")),
                    ints(o.getJSONArray("r")), doubles(o.getJSONArray("v")))
            }
            return RandomForest(features, options, trees)
        }

        private fun ints(a: JSONArray) = IntArray(a.length()) { a.getInt(it) }
        private fun doubles(a: JSONArray) = DoubleArray(a.length()) { a.getDouble(it) }
    }
}
