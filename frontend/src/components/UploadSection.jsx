import React, { useState, useEffect, useCallback } from "react";
import {
    Upload, X, Image, FolderOpen,
    AlertCircle, Check, Loader
} from "lucide-react";

const steps = [
    "Analyzing leaf structure...",
    "Identifying patterns...",
    "Running detection model..."
];

const sampleImages = [
    { name: "Bacterial Leaf Spot", file: "leaf_bacterial.jpg" },
    { name: "Healthy Leaf", file: "leaf_healthy.jpg" },
    { name: "Powdery Mildew", file: "leaf_mildew.jpg" }
];

const UploadSection = ({ onUpload }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showSampleImages, setShowSampleImages] = useState(false);
    const [loadingStep, setLoadingStep] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handleFile(file);
        }
    }, []);

    const handleFile = (file) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(file);
        setFile(file);
        setPreviewUrl(url);
        onUpload(url, file); // Send to parent
    };

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleSampleSelect = async (filename) => {
        try {
            const response = await fetch(`/samples/${filename}`);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: blob.type });
            handleFile(file);
            setShowSampleImages(false);
        } catch (error) {
            console.error("Failed to load sample image:", error);
            alert("Failed to load sample image");
        }
    };

    const simulateProcessing = async () => {
        setLoadingProgress(0);
        for (let i = 0; i < steps.length; i++) {
            setLoadingStep(steps[i]);
            for (let p = 0; p <= 100; p += 5) {
                setLoadingProgress(p);
                await new Promise(r => setTimeout(r, 30));
            }
        }
        setLoadingStep(null);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <button
                onClick={() => setShowSampleImages(true)}
                className="absolute bottom-4 right-4 flex flex-row items-center gap-2 bg-emerald-600 text-white p-2 rounded-lg shadow-md hover:bg-emerald-700 z-10"
            >
                <FolderOpen className="w-4 h-4" /> Sample Images
            </button>

            {showSampleImages && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSampleImages(false)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-emerald-800">Sample Images</h3>
                            <button
                                onClick={() => setShowSampleImages(false)}
                                className="p-1 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {sampleImages.map((sample) => (
                                <div
                                    key={sample.file}
                                    className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden"
                                    onClick={() => handleSampleSelect(sample.file)}
                                >
                                    <img
                                        src={`/samples/${sample.file}`}
                                        alt={sample.name}
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-start justify-end p-3 opacity-100">
                                        <span className="text-white font-medium">{sample.name}</span>
                                        <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded mt-1">Select</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`flex flex-col items-center justify-center w-full h-full ${dragActive ? "bg-emerald-50" : "bg-gray-900"
                    } transition-all`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                />

                {loadingStep ? (
                    <div className="flex flex-col items-center space-y-6 p-8 text-white">
                        <Loader className="w-12 h-12 text-emerald-400 animate-spin" />
                        <div className="space-y-2 w-64">
                            <p className="text-center text-emerald-300 font-medium">{loadingStep}</p>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all"
                                    style={{ width: `${loadingProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center h-full w-full cursor-pointer p-8"
                    >
                        <div className="flex flex-col items-center space-y-6">
                            <div className="p-4 bg-emerald-100 rounded-full">
                                <Upload className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-white mb-2">
                                    Drag and drop your image here
                                </p>
                                <p className="text-sm text-emerald-300 mb-6">
                                    or click to browse files
                                </p>
                                <button className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-lg transition-colors">
                                    Select Image
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">
                                Supported formats: JPEG, PNG
                            </p>
                        </div>
                    </label>
                )}
            </div>

            {isZoomed && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsZoomed(false)}
                >
                    <div className="relative max-w-full max-h-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsZoomed(false);
                            }}
                            className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black/80"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={previewUrl}
                            alt="Zoomed"
                            className="max-w-full max-h-screen object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadSection;