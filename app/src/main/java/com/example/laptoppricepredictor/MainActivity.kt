package com.example.laptoppricepredictor

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.NumberFormat
import java.util.Locale

private val Navy = Color(0xFF0D2B5E)
private val Blue = Color(0xFF1E5AA8)
private val Bg = Color(0xFFF4F7FC)

private val DEFAULTS = mapOf(
    "brand" to "Dell", "processor" to "Intel i5", "ram" to "8 GB", "storage" to "512 GB",
    "storage_type" to "SSD", "condition" to "Good", "gpu" to "No"
)
private const val DEFAULT_AGE = "3"

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { App() }
    }
}

@Composable
fun App() {
    val context = LocalContext.current
    val model = remember { runCatching { RandomForest.load(context) } }
    MaterialTheme(colorScheme = lightColorScheme(primary = Navy, secondary = Blue, background = Bg, surface = Color.White)) {
        Surface(Modifier.fillMaxSize().systemBarsPadding(), color = Bg) {
            val rf = model.getOrNull()
            if (rf == null) {
                Text("Could not load the prediction model.", Modifier.padding(24.dp), color = Color.Red)
            } else {
                PredictorScreen(rf)
            }
        }
    }
}

@Composable
fun PredictorScreen(model: RandomForest) {
    val sel = remember { mutableStateMapOf<String, String>().apply { putAll(DEFAULTS) } }
    var age by remember { mutableStateOf(DEFAULT_AGE) }
    var ageError by remember { mutableStateOf<String?>(null) }
    var result by remember { mutableStateOf<Double?>(null) }

    fun predict() {
        val a = age.trim().toIntOrNull()
        if (a == null || a !in 0..10) {
            ageError = "Enter a whole number from 0 to 10"
            result = null
            return
        }
        ageError = null
        val price = model.predict(model.encode(sel, a))
        result = Math.round(price / 100.0) * 100.0
    }

    fun reset() {
        sel.clear(); sel.putAll(DEFAULTS)
        age = DEFAULT_AGE; ageError = null; result = null
    }

    @Composable
    fun Pick(key: String, label: String, modifier: Modifier = Modifier) {
        Dropdown(label, model.options.getValue(key), sel.getValue(key), modifier) { sel[key] = it }
    }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Laptop Price Predictor", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Navy)
        Text("Estimate the resale price of a used laptop", fontSize = 15.sp, color = Blue)

        Card(colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Pick("brand", "Brand", Modifier.weight(1f))
                    Pick("processor", "Processor", Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Pick("ram", "RAM", Modifier.weight(1f))
                    Pick("storage", "Storage capacity", Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Pick("storage_type", "Storage type", Modifier.weight(1f))
                    Pick("condition", "Condition", Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = age,
                        onValueChange = { age = it.filter(Char::isDigit).take(2); ageError = null },
                        label = { Text("Age (years, 0–10)") },
                        singleLine = true,
                        isError = ageError != null,
                        supportingText = { ageError?.let { Text(it) } },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    Pick("gpu", "Dedicated graphics", Modifier.weight(1f))
                }
            }
        }

        Button(
            onClick = { predict() },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Navy)
        ) { Text("Predict Price", fontSize = 17.sp, fontWeight = FontWeight.SemiBold) }

        OutlinedButton(onClick = { reset() }, modifier = Modifier.fillMaxWidth()) { Text("Reset", color = Navy) }

        result?.let { price ->
            val text = NumberFormat.getNumberInstance(Locale("en", "IN")).apply { maximumFractionDigits = 0 }.format(price)
            Card(colors = CardDefaults.cardColors(containerColor = Navy), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(20.dp)) {
                    Text("Estimated resale price", color = Color(0xFFBFD3F2), fontSize = 14.sp)
                    Spacer(Modifier.height(4.dp))
                    Text("₹ $text", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Text(
            "This is only an estimate from a Random Forest model trained on sample data. " +
                "Actual resale prices vary with market and seller.",
            fontSize = 12.sp, color = Color(0xFF5B6B85)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Dropdown(label: String, options: List<String>, value: String, modifier: Modifier = Modifier, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = modifier) {
        OutlinedTextField(
            value = value, onValueChange = {}, readOnly = true, singleLine = true,
            label = { Text(label, maxLines = 1) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { o ->
                DropdownMenuItem(text = { Text(o) }, onClick = { onSelect(o); expanded = false })
            }
        }
    }
}
