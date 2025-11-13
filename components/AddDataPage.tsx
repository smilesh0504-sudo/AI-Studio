import React, { useState } from 'react';
import { FileText, Image as ImageIcon, ArrowRight, TrendingUp, LoaderCircle, CheckCircle, X } from 'lucide-react';

interface AddDataPageProps {
    dataCount: number;
    newlyAddedCount: number;
    onFileUpload: (file: File) => void;
    onImageUpload: (files: File[]) => Promise<{ valid: boolean; count: number }>;
    onProcessTextData: (data: { item: string, totalSpent: number, category: string }[]) => void;
    onGoToResult: () => void;
    isLoading: boolean;
}

const PRIMARY_BLUE = '#3182F6';

const AddDataPage: React.FC<AddDataPageProps> = ({ dataCount, newlyAddedCount, onFileUpload, onImageUpload, onProcessTextData, onGoToResult, isLoading }) => {
    const [uploadedImages, setUploadedImages] = useState<{ file: File, url: string }[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // FIX: Add explicit File[] type to help TypeScript inference and prevent error with URL.createObjectURL.
            const files: File[] = Array.from(e.target.files);
            if (files.length === 0) return;

            const newImagePreviews = files.map(file => ({ file, url: URL.createObjectURL(file) }));
            setUploadedImages(prev => [...prev, ...newImagePreviews]);

            // Clear the input value to allow re-uploading the same file
            e.target.value = '';
        }
    };
    
    const handleTextBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const parsed = lines.map(line => {
            const parts = line.split(/\s+/);
            const amount = Math.abs(parseFloat(parts[parts.length - 1].replace(/,/g, '')));
            const item = parts.slice(0, parts.length - 1).join(' ');
            return { item, totalSpent: isNaN(amount) ? 0 : amount, category: '알 수 없음' };
        }).filter(d => d.totalSpent > 0);

        if (parsed.length > 0) {
            onProcessTextData(parsed);
            e.target.value = '';
        }
    };

    const removeImage = (urlToRemove: string) => {
        const imageToRemove = uploadedImages.find(img => img.url === urlToRemove);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.url);
        }
        setUploadedImages(prev => prev.filter(img => img.url !== urlToRemove));
    };

    const handleGoToResultClick = async () => {
        if (uploadedImages.length > 0) {
            const imageFiles = uploadedImages.map(img => img.file);
            const result = await onImageUpload(imageFiles);

            if(!result.valid) {
                 alert(`⚠️ 잘못된 이미지가 감지되었습니다! 금융 거래 내역 이미지를 업로드해주세요.`);
                 // Do not proceed if images are invalid. The user must remove them.
                 return;
            } else {
                 alert(`✅ ${imageFiles.length}장의 이미지에서 ${result.count}개의 데이터를 추가했습니다!`);
            }
        }
        onGoToResult();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-center gap-2">
                    <div style={{ backgroundColor: PRIMARY_BLUE }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: PRIMARY_BLUE }}>소비 데이터 추가</h1>
                </div>
            </header>

            <main className="flex-grow">
                <div className="max-w-2xl mx-auto px-5 py-8">
                     <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            추가 데이터를<br />입력해주세요
                        </h2>
                        <p className="text-gray-600 text-base">더 정확한 분석을 위해 데이터를 추가하세요</p>
                    </div>

                    {newlyAddedCount > 0 && !isLoading && (
                        <div className="bg-green-50 text-green-800 rounded-2xl p-4 mb-4 text-center border-2 border-green-200 flex items-center justify-center gap-2">
                            <CheckCircle size={20} />
                            <p className="font-semibold">
                                 {newlyAddedCount}개의 데이터가 추가되었습니다!
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="cursor-pointer block">
                            <div className="bg-white rounded-2xl p-6 text-center hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-blue-300">
                                <FileText className="mx-auto mb-3" style={{ color: PRIMARY_BLUE }} size={40} />
                                <span className="text-base font-bold text-gray-900 block mb-1">파일 업로드</span>
                                <span className="text-sm text-gray-500">CSV, Excel, TXT</span>
                            </div>
                            <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileChange} className="hidden" />
                        </label>

                       <label className="cursor-pointer block">
                            <div className="bg-white rounded-2xl p-6 text-center hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-blue-300 flex flex-col items-center">
                                 <ImageIcon className="mb-3" style={{ color: PRIMARY_BLUE }} size={40} />
                                 <span className="text-base font-bold text-gray-900 block mb-1">
                                    {uploadedImages.length > 0 ? `${uploadedImages.length}개의 이미지 선택됨` : '이미지 업로드'}
                                </span>
                                 <span className="text-sm text-gray-500">거래내역, 영수증 이미지</span>
                                 
                                 {uploadedImages.length > 0 && (
                                    <div className="mt-4 w-full bg-gray-50 p-3 rounded-lg">
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                            {uploadedImages.map((img) => (
                                                <div key={img.url} className="relative aspect-square">
                                                    <img src={img.url} alt="업로드된 이미지" className="w-full h-full object-cover rounded-lg shadow-sm" />
                                                    <button 
                                                        onClick={(e) => { e.preventDefault(); removeImage(img.url); }} 
                                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md transition-transform hover:scale-110">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                 )}
                            </div>
                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        </label>


                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                            <div className="text-center mb-3">
                                <FileText className="mx-auto mb-2" style={{ color: PRIMARY_BLUE }} size={40} />
                                <span className="text-base font-bold text-gray-900 block mb-1">텍스트로 입력</span>
                                <span className="text-sm text-gray-500">한 줄에 하나씩 붙여넣으세요</span>
                            </div>
                            <textarea
                                placeholder="예시:&#10;CGV 영화 -15000"
                                onBlur={handleTextBlur}
                                className="w-full h-32 bg-gray-100 rounded-xl p-4 border-0 focus:outline-none focus:ring-2 resize-none text-sm text-gray-700"
                                style={{'--tw-ring-color': PRIMARY_BLUE} as React.CSSProperties}
                            />
                        </div>
                    </div>
                </div>
            </main>
            
            <footer className="sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-200">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-blue-100 rounded-xl p-3 mb-4 text-center border border-blue-200">
                        <p className="font-semibold" style={{ color: '#1E40AF' }}>
                            현재 총 <span className="text-2xl font-bold" style={{color: PRIMARY_BLUE}}>{dataCount}</span>개의 소비 데이터
                        </p>
                    </div>
                    <button
                        onClick={handleGoToResultClick}
                        disabled={isLoading}
                        style={{ backgroundColor: !isLoading ? PRIMARY_BLUE : '' }}
                        className="w-full text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 text-lg disabled:bg-gray-400"
                    >
                        {isLoading ? <LoaderCircle className="animate-spin" size={24} /> : <>분석 결과 보기 <ArrowRight size={24} /></>}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AddDataPage;