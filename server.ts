import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { parseCSV, serializeCSV, sanitizeRecords } from "./src/utils/sanitizer";
import { PorscheRecord } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const BASE_CSV_PATH = path.join(process.cwd(), "Planilha base Porsche.csv");
const SANITIZED_CSV_PATH = path.join(process.cwd(), "Porsche_Sales_Sanitized.csv");
const SCHEMA_MD_PATH = path.join(process.cwd(), "schema.md");

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Utility to load raw records from CSV path
function getRecordsFromCSV(filePath: string): PorscheRecord[] {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf-8");
  const parsed = parseCSV(text);
  if (parsed.length === 0) return [];
  
  const headers = parsed[0];
  const records: PorscheRecord[] = [];
  
  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    if (row.length === 0) continue;
    const rec: any = {};
    headers.forEach((h, colIndex) => {
      rec[h] = row[colIndex] || "";
    });
    records.push(rec as PorscheRecord);
  }
  
  return records;
}

// Ensure the Base CSV is parsed on startup to verify integrity
let cachedRawData = "";
if (fs.existsSync(BASE_CSV_PATH)) {
  cachedRawData = fs.readFileSync(BASE_CSV_PATH, "utf-8");
}

// --- API ROUTES ---

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Load all dataset records (original raw + original parsed + sanitized parsed)
app.get("/api/data", (req, res) => {
  try {
    const hasSanitized = fs.existsSync(SANITIZED_CSV_PATH);
    const originalRecords = getRecordsFromCSV(BASE_CSV_PATH);
    const sanitizedRecords = hasSanitized ? getRecordsFromCSV(SANITIZED_CSV_PATH) : [];
    const schemaContent = fs.existsSync(SCHEMA_MD_PATH) ? fs.readFileSync(SCHEMA_MD_PATH, "utf-8") : "";
    
    res.json({
      originalRaw: cachedRawData,
      originalRecords,
      sanitizedRecords,
      hasSanitized,
      schemaContent
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Process Sanitization and Write to File
app.post("/api/sanitize", (req, res) => {
  try {
    const { customCsvText } = req.body;
    let recordsToSanitize: PorscheRecord[] = [];
    
    if (customCsvText) {
      const parsed = parseCSV(customCsvText);
      if (parsed.length > 0) {
        const headers = parsed[0];
        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length === 0) continue;
          const rec: any = {};
          headers.forEach((h, colIndex) => {
            rec[h] = row[colIndex] || "";
          });
          recordsToSanitize.push(rec as PorscheRecord);
        }
      }
    } else {
      recordsToSanitize = getRecordsFromCSV(BASE_CSV_PATH);
    }
    
    if (recordsToSanitize.length === 0) {
      return res.status(400).json({ error: "Nenhum registro encontrado para sanitizar." });
    }
    
    const { sanitized, logs } = sanitizeRecords(recordsToSanitize);
    
    // Quality check headers and column ordering:
    // headers should have sanitized columns inserted immediately after their source columns
    const headers = [
      "sale_id",
      "sale_date", "SaleDateSanitized",
      "customer_name",
      "porsche_model", "PorscheModelSanitized",
      "model_year", "ModelYearSanitized",
      "sale_price", "SalesPriceSanitized",
      "vehicle_mileage", "VehicleMileageSanitized",
      "payment_method", "PayMethodSanitized",
      "city", "CitySanitized",
      "state", "StateSanitized",
      "salesperson",
      "delivery_status", "DeliveryStatusSanitized"
    ];
    
    const rows = sanitized.map(rec => [
      rec.sale_id,
      rec.sale_date, rec.SaleDateSanitized || "",
      rec.customer_name,
      rec.porsche_model, rec.PorscheModelSanitized || "",
      rec.model_year, rec.ModelYearSanitized || "",
      rec.sale_price, rec.SalesPriceSanitized || "",
      rec.vehicle_mileage, rec.VehicleMileageSanitized || "",
      rec.payment_method, rec.PayMethodSanitized || "",
      rec.city, rec.CitySanitized || "",
      rec.state, rec.StateSanitized || "",
      rec.salesperson,
      rec.delivery_status, rec.DeliveryStatusSanitized || ""
    ]);
    
    const csvContent = serializeCSV(headers, rows);
    
    // Save to server disk if it's the default base CSV
    if (!customCsvText) {
      fs.writeFileSync(SANITIZED_CSV_PATH, csvContent, "utf-8");
    }
    
    res.json({
      success: true,
      sanitizedRecords: sanitized,
      logs,
      csvContent
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Download processed CSV
app.get("/api/download", (req, res) => {
  try {
    if (!fs.existsSync(SANITIZED_CSV_PATH)) {
      // If it doesn't exist yet, build it on the fly
      const originalRecords = getRecordsFromCSV(BASE_CSV_PATH);
      if (originalRecords.length > 0) {
        const { sanitized } = sanitizeRecords(originalRecords);
        const headers = [
          "sale_id", "sale_date", "SaleDateSanitized", "customer_name",
          "porsche_model", "PorscheModelSanitized", "model_year", "ModelYearSanitized",
          "sale_price", "SalesPriceSanitized", "vehicle_mileage", "VehicleMileageSanitized",
          "payment_method", "PayMethodSanitized", "city", "CitySanitized",
          "state", "StateSanitized", "salesperson", "delivery_status", "DeliveryStatusSanitized"
        ];
        const rows = sanitized.map(rec => [
          rec.sale_id, rec.sale_date, rec.SaleDateSanitized || "", rec.customer_name,
          rec.porsche_model, rec.PorscheModelSanitized || "", rec.model_year, rec.ModelYearSanitized || "",
          rec.sale_price, rec.SalesPriceSanitized || "", rec.vehicle_mileage, rec.VehicleMileageSanitized || "",
          rec.payment_method, rec.PayMethodSanitized || "", rec.city, rec.CitySanitized || "",
          rec.state, rec.StateSanitized || "", rec.salesperson, rec.delivery_status, rec.DeliveryStatusSanitized || ""
        ]);
        const csvContent = serializeCSV(headers, rows);
        fs.writeFileSync(SANITIZED_CSV_PATH, csvContent, "utf-8");
      } else {
        return res.status(404).json({ error: "Planilha base não encontrada para exportar." });
      }
    }
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Porsche_Sales_Sanitized.csv");
    const fileStream = fs.createReadStream(SANITIZED_CSV_PATH);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Reset Sanitize (Deletes the sanitized file so user can rerun)
app.post("/api/reset", (req, res) => {
  try {
    if (fs.existsSync(SANITIZED_CSV_PATH)) {
      fs.unlinkSync(SANITIZED_CSV_PATH);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. AI Agent Chatbot powered by Gemini
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, dataContext } = req.body;
    
    if (!ai) {
      return res.json({
        text: "Desculpe, a chave do Gemini API não está configurada ou é inválida neste ambiente. Configure sua chave no painel **Settings > Secrets** para usar o Agente de IA completo! Enquanto isso, a ferramenta de sanitização local automatizada está 100% ativa.",
      });
    }
    
    const userMessage = messages[messages.length - 1]?.text || "";
    
    // Prepare a structured prompt with the data state and schema definitions
    const systemInstruction = `
      Você é o Porsche Sales Data Sanitizer Agent, um Co-piloto especialista em auditoria e qualidade de dados de vendas de automóveis Porsche nos EUA.
      Você ajuda o usuário a entender, limpar e obter estatísticas sobre as vendas.
      
      Regras de Negócio e Sanitização em vigor (schema.md):
      - Datas: Devem ser ISO YYYY-MM-DD. Datas impossíveis (como 30 de Fevereiro, 31 de Abril, 40 de Dezembro) devem virar INVALID.
      - Modelos: Normalizados para o catálogo oficial da Porsche (Ex: 911 Carrera S, Taycan Turbo S, Macan GTS, etc.).
      - Anos: Formatados para 4 dígitos (Ex: vinte vinte quatro -> 2024, 20-24 -> 2024). De 1990 a 2035. Anos fora disso são INVALID.
      - Preços: Apenas números decimais sem símbolos (Ex: $121k -> 121000.00, eighty two thousand -> 82000.00).
      - Quilometragem: Inteiro em milhas. KM deve ser convertido para milhas (1 km = 0.621371 milhas). Palavras como 'zero' ou 'new' viram 0.
      - Estado: Código USPS de 2 letras (Ex: California -> CA, ma -> MA). Desconhecidos viram INVALID.
      - Status de Entrega: Traduzido para termos controlados (Ex: Delivered, Pending, In Transit, Shipped, Cancelled). Lidar com o erro 'DELIVERD'.
      
      Contexto dos dados atuais (Primeiros 10 registros e resumo estatístico):
      - Total de registros originais: ${dataContext?.totalRecords || 0}
      - Registros sanitizados: ${dataContext?.hasSanitized ? "Sim (Completo)" : "Não sanitizado ainda"}
      - Alguns erros identificados nos dados originais:
        * Datas inválidas como "2024-02-30", "April 31st, 2024", "2025-12-40"
        * Anos por extenso como "twenty twenty four", "twenty twenty two"
        * Preços com k ("$121k", "188k USD") e descrições textuais ("eighty two thousand USD")
        * KM misturado com milhas ("KM 18,900" convertido para "11744" milhas)
        * Estados por extenso ("colorado" -> "CO", "New York" -> "NY")
        * Typos de entrega ("DELIVERD" -> "Delivered", "delivered!!!" -> "Delivered")
      
      Por favor, responda de forma elegante, profissional e amigável em Português. Use tabelas ou marcadores do markdown para responder sobre estatísticas ou dúvidas de registros específicos.
    `;
    
    // Construct the contents structure required by the new @google/genai SDK
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Erro ao processar chamada de IA: " + error.message });
  }
});

// --- VITE AND STATIC ASSET SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Porsche Sanitizer Agent running on http://localhost:${PORT}`);
  });
}

startServer();
