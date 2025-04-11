import React, { useRef, useState, useEffect } from 'react';
import {
  Camera, Upload, RotateCcw, Microscope,
  ChevronDown, Share, Download, Leaf, AlertTriangle
} from 'lucide-react';
import UploadSection from './components/UploadSection';
import ResultsPanel from './components/ResultsPanel';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [detections, setDetections] = useState([]);
  const [mode, setMode] = useState('camera');
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (mode === 'camera' && !image) startCamera();

    // Clean up camera stream on unmount
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]);

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
        // Fallback to upload mode if camera is not available
        setMode('upload');
      });
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL('image/png');
    setImage(imageDataURL);

    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());

    canvas.toBlob(blob => setImageBlob(blob), 'image/png');
  };

  const handleUploadResult = (previewImage, fileBlob) => {
    setImage(previewImage);
    setImageBlob(fileBlob);
    setShowResults(false);
  };

  const analyzeImage = async () => {
    if (!imageBlob) return;

    setAnalyzing(true);
    setShowResults(false);

    try {
      const formData = new FormData();
      formData.append("file", imageBlob, "image.png");

      const response = await fetch("http://localhost:8000/detect/", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      setDetections(data.detections || []);
      setShowResults(true);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageBlob(null);
    setDetections([]);
    setShowResults(false);
    if (mode === 'camera') startCamera();
  };

  const downloadResults = () => {
    // Create a downloadable report with the image and detections
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = image;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Draw detection boxes
      detections.forEach(det => {
        const [x1, y1, x2, y2] = det.bbox;
        ctx.strokeStyle = '#FF4B4B';
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        // Draw label
        ctx.fillStyle = '#FF4B4B';
        ctx.font = 'bold 16px Arial';
        const text = `${det.class_name} (${(det.confidence * 100).toFixed(1)}%)`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);
        ctx.fillStyle = 'white';
        ctx.fillText(text, x1 + 5, y1 - 5);
      });

      // Convert and download
      const link = document.createElement('a');
      link.download = 'plant-analysis-result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  const renderBoxes = () =>
    detections.map((det, i) => {
      const [x1, y1, x2, y2] = det.bbox;
      return (
        <div
          key={i}
          className="absolute border-2 border-red-600 bg-red-500/10 text-white text-xs font-semibold px-1"
          style={{ left: x1, top: y1, width: x2 - x1, height: y2 - y1 }}
        >
          <span className="bg-red-600 px-1 py-0.5 rounded">
            {det.class_name} ({(det.confidence * 100).toFixed(1)}%)
          </span>
        </div>
      );
    });

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-start pb-24">
      {/* Header */}
      <header className="w-full bg-white shadow-md py-4 px-6 mb-8 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Leaf className="text-emerald-600 w-8 h-8 mr-2" />
            <h1 className="text-2xl font-bold text-emerald-700">PlantGuard</h1>
          </div>
          <div className="text-sm text-emerald-700 font-medium">
            Plant Disease Detection Platform
          </div>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-4 flex flex-col">
        {/* Mode Switch */}
        <div className="flex bg-white rounded-full overflow-hidden shadow-md mb-8 mx-auto w-fit">
          <button
            onClick={() => { setMode('camera'); reset(); }}
            className={`px-6 py-3 font-medium flex items-center ${mode === 'camera' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'} transition-all`}
          >
            <Camera className="w-5 h-5 mr-2" /> Camera
          </button>
          <button
            onClick={() => { setMode('upload'); reset(); }}
            className={`px-6 py-3 font-medium flex items-center ${mode === 'upload' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'} transition-all`}
          >
            <Upload className="w-5 h-5 mr-2" /> Upload
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8" >
          {/* Image Area */}
          <div className="w-full lg:w-3/5 mx-auto">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-black">
              {!image ? (
                mode === 'camera' ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <UploadSection onUpload={handleUploadResult} />
                )
              ) : (
                <>
                  <img src={image} alt="Captured" className="w-full h-full object-contain" />
                  {detections.length > 0 && <div ref={overlayRef} className="absolute inset-0 z-10 translate-x-[30%] translate-y-[15%]">{renderBoxes()}</div>}
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center mt-6 gap-4">
              {!image && mode === 'camera' && (
                <button
                  onClick={takePhoto}
                  className="px-6 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md flex items-center"
                >
                  <Camera className="w-5 h-5 mr-2" /> Take Picture
                </button>
              )}

              {image && (
                <>
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className={`px-6 py-3 rounded-full ${analyzing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-all shadow-md flex items-center`}
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Microscope className="w-5 h-5 mr-2" /> Analyze
                      </>
                    )}
                  </button>

                  <button
                    onClick={reset}
                    className="px-6 py-3 rounded-full bg-gray-700 text-white hover:bg-gray-800 transition-all shadow-md flex items-center"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" /> Reset
                  </button>

                  {detections.length > 0 && (
                    <button
                      onClick={downloadResults}
                      className="px-6 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md flex items-center"
                    >
                      <Download className="w-5 h-5 mr-2" /> Download
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Results Panel */}
          {image && showResults && (
            <div className="w-full lg:w-2/5">
              <ResultsPanel detections={detections} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;