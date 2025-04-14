import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  HelpCircle,
  Clipboard,
  Share,
  Loader,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import OpenAI from "openai";
import "./markdown.css";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: import.meta.env.VITE_OPENROUTER_KEY,
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
    "X-Title": "PlantGuard Disease Detection",
  },
  dangerouslyAllowBrowser: true,
});

const ResultsPanel = ({ classificationResult }) => {
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedTip, setCopiedTip] = useState(false);

  // Handle no detections case
  if (!classificationResult || !classificationResult.predicted_class) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 h-full">
        <div className="flex items-center justify-center flex-col h-full text-center p-8">
          <HelpCircle className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No Issues Detected
          </h3>
          <p className="text-gray-500">
            Our system couldn't identify any specific diseases or issues with
            this plant image.
          </p>
        </div>
      </div>
    );
  }

  // Get the condition name from the API response
  const conditionName = classificationResult.predicted_class;
  const confidence = classificationResult.confidence;

  // Fetch AI data when detection changes
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        const detectionPrompt = `
          You are an expert in plant pathology and gardening. In this plant image, we've detected "${conditionName}" with ${(
          confidence * 100
        ).toFixed(1)}% confidence.
          
          Please create a complete analysis report in markdown format with the following sections:
          
          # ${conditionName}
          
          ## Description
          [Provide a 2-3 sentence description of this plant condition]
          
          ## Severity
          [Indicate severity as: none, low, medium, high, or very high. Explain why briefly.]
          
          ## Recommended Treatments
          [List 3-4 specific treatment recommendations as bullet points]
          
          ## Prevention
          [Provide 2-3 sentences on how to prevent this condition]
          
          If this is a healthy plant, adjust your response accordingly. Keep all information practical and focused on plant care.
        `;

        const completion = await openai.chat.completions.create({
          model: "anthropic/claude-3-haiku:free",
          messages: [
            {
              role: "user",
              content: detectionPrompt,
            },
          ],
        });

        const responseText = completion.choices[0].message.content;
        setAiResponse(responseText);
        setLoading(false);
      } catch (error) {
        console.error("AI analysis error:", error);
        setError("Failed to connect to analysis service");
        setLoading(false);
      }
    };

    if (conditionName) {
      fetchAIAnalysis();
    }
  }, [conditionName, confidence]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopiedTip(true);
    setTimeout(() => setCopiedTip(false), 2000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 h-full">
        <div className="flex items-center justify-center flex-col h-full text-center p-8">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Analyzing Plant Condition
          </h3>
          <p className="text-gray-500">
            Our AI is generating detailed information about {conditionName}...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 h-full">
        <div className="flex items-center justify-center flex-col h-full text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Analysis Error
          </h3>
          <p className="text-gray-500">
            {error}. The condition detected was "{conditionName}" with{" "}
            {(confidence * 100).toFixed(1)}% confidence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
      {/* Header */}
      <div className="bg-emerald-700 p-6 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <div className="text-emerald-200 text-sm">
            Main detection: {conditionName} ({(confidence * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        <div className="prose prose-emerald max-w-none markdown-body">
          <ReactMarkdown>
            {aiResponse.replace("___", " - ").trim().replace("_", " ")}
          </ReactMarkdown>
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t border-gray-200 p-4 flex flex-wrap gap-3">
        <button
          onClick={copyToClipboard}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm transition-colors"
        >
          <Clipboard className="w-4 h-4 mr-2" />
          {copiedTip ? "Copied!" : "Copy Report"}
        </button>

        <button className="flex items-center px-4 py-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-700 text-sm transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Download Analysis
        </button>

        <button className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 text-sm transition-colors ml-auto">
          <Share className="w-4 h-4 mr-2" />
          Share Results
        </button>
      </div>
    </div>
  );
};

export default ResultsPanel;
