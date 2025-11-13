import React from 'react';
import { Archive, ArrowLeft, Eye, Trash2 } from 'lucide-react';
import type { AnalysisVersion } from '../types';
import { PERSONAS } from '../App';

interface HistoryPageProps {
    versions: AnalysisVersion[];
    onViewVersion: (id: string) => void;
    onDeleteVersion: (id: string) => void;
    onGoBack: () => void;
}

const PRIMARY_BLUE = '#3182F6';

const HistoryPage: React.FC<HistoryPageProps> = ({ versions, onViewVersion, onDeleteVersion, onGoBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
                    <button onClick={onGoBack} className="p-2 -ml-2 text-gray-600 hover:text-blue-600">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold" style={{ color: PRIMARY_BLUE }}>분석 기록</h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </header>
            <main className="flex-grow max-w-2xl mx-auto w-full px-5 py-8">
                {versions.length === 0 ? (
                    <div className="text-center py-20">
                        <Archive size={60} className="mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800">기록이 없습니다</h2>
                        <p className="text-gray-500 mt-2">분석을 완료하고 저장하면 여기에 표시됩니다.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {versions.map(version => {
                            const personaInfo = version.persona ? PERSONAS[version.persona] : null;
                            // FIX: Add type annotation to reduce accumulator and explicitly cast value to number to prevent type errors.
                            const totalSpent = Object.values(version.analysis || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
                            
                            // A simple icon based on the first character of the persona name
                            const personaInitial = personaInfo ? personaInfo.name.charAt(0) : '?';

                            return (
                                <li key={version.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
                                    <div 
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-3xl"
                                        style={{ backgroundColor: personaInfo?.color || '#A0AEC0' }}
                                    >
                                        <span>{personaInitial}</span>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-lg text-gray-900 truncate">{personaInfo?.name || '알 수 없음'}</p>
                                        <p className="text-sm text-gray-500">{new Date(version.createdAt).toLocaleString()}</p>
                                        <p className="text-sm text-gray-600 font-medium mt-1">
                                            {version.data.length}개 항목 / ₩{totalSpent.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button 
                                            onClick={() => onViewVersion(version.id)} 
                                            className="p-3 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-transform transform hover:scale-110"
                                            aria-label="View Details"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button 
                                            onClick={() => { if (confirm('이 기록을 삭제하시겠습니까?')) onDeleteVersion(version.id); }} 
                                            className="p-3 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-transform transform hover:scale-110"
                                            aria-label="Delete Entry"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
        </div>
    );
};

export default HistoryPage;