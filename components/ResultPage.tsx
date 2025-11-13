import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import type { Transaction, AnalysisResult, Category } from '../types';
import { PERSONAS } from '../App';
import { generateIcon } from '../services/geminiService';

interface LiveResultPageProps {
    persona: string | null;
    analysis: AnalysisResult | null;
    data: Transaction[];
    isHistoryView: false;
    onAddData: () => void;
    onFinish: () => void;
}

interface HistoryResultPageProps {
    persona: string | null;
    analysis: AnalysisResult | null;
    data: Transaction[];
    isHistoryView: true;
    onGoBackToHistory: () => void;
}

type ResultPageProps = LiveResultPageProps | HistoryResultPageProps;


const PRIMARY_BLUE = '#3182F6';
const FINISH_GREEN = '#00C471';

const IconPlaceholder: React.FC<{className?: string}> = ({ className }) => (
    <div className={`bg-gray-200 rounded-full animate-pulse ${className}`}></div>
);


const ResultPage: React.FC<ResultPageProps> = (props) => {
    // FIX: To enable correct type narrowing for the discriminated union `ResultPageProps`,
    // the `isHistoryView` property is removed from destructuring here and accessed
    // directly from `props` in the footer's conditional check.
    const { persona, analysis, data } = props;
    const [icons, setIcons] = useState<{ [key: string]: string }>({});
    const [excludeUnknown, setExcludeUnknown] = useState(false);

    const { displayedPersona, displayedAnalysis, displayedTotalSpent } = useMemo(() => {
        if (excludeUnknown && analysis) {
            const filteredAnalysis = { ...analysis };
            delete filteredAnalysis['알 수 없음'];

            if (Object.keys(filteredAnalysis).length === 0) {
                 return { displayedPersona: null, displayedAnalysis: {}, displayedTotalSpent: 0 };
            }
            
            // FIX: Explicitly cast values to numbers for arithmetic operation to prevent type errors.
            const sorted = Object.entries(filteredAnalysis).sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0));
            const topCategory = sorted[0][0];
            // FIX: Add type annotation to reduce accumulator and explicitly cast value to number to prevent type errors.
            const total = Object.values(filteredAnalysis).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
            
            return {
                displayedPersona: topCategory,
                displayedAnalysis: filteredAnalysis,
                displayedTotalSpent: total
            };

        }
        // FIX: Add type annotation to reduce accumulator and explicitly cast value to number to prevent type errors.
        const total = Object.values(analysis || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
        return {
            displayedPersona: persona,
            displayedAnalysis: analysis,
            displayedTotalSpent: total
        };
    }, [excludeUnknown, analysis, persona]);

    const personaInfo = displayedPersona ? PERSONAS[displayedPersona as string] : null;

    useEffect(() => {
        if (!persona || !analysis) return;

        const fetchIconsSequentially = async () => {
             const keysToFetch = Array.from(new Set([
                persona,
                ...Object.keys(analysis),
                ...data.map(d => d.reclassified)
            ].filter(Boolean) as string[]));
            
            for (const key of keysToFetch) {
                if (!icons[key]) {
                    const personaDetails = PERSONAS[key as Category] || personaInfo;
                    if (personaDetails) {
                        const prompt = personaDetails.iconPrompt || key;
                        const color = personaDetails.color;
                        try {
                           const iconUrl = await generateIcon(prompt, color);
                           setIcons(prev => ({ ...prev, [key]: iconUrl }));
                        } catch (e) {
                           console.error(`Failed to fetch icon for ${key}`, e);
                           setIcons(prev => ({ ...prev, [key]: "ERROR" })); // Mark as failed
                        }
                    }
                }
            }
        };

        fetchIconsSequentially();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [persona, analysis, data]);


    if (!personaInfo || !displayedAnalysis) {
        return (
            <div className="flex items-center justify-center min-h-screen text-center p-5">
                 <div>
                    <h2 className="text-xl font-bold mb-2">분석 데이터가 부족합니다.</h2>
                    <p className="text-gray-600">'알 수 없는 소비'를 제외하니 표시할 데이터가 없네요!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-2xl mx-auto px-5 py-4 text-center">
                    <h1 className="text-2xl font-bold" style={{ color: PRIMARY_BLUE }}>페르소나 분석 결과</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto py-6 pb-32">
                 <div className="flex justify-end mb-4 px-5">
                    <label htmlFor="exclude-toggle" className="flex items-center cursor-pointer">
                        <span className="mr-3 text-sm font-medium text-gray-700">알 수 없는 소비 제외</span>
                        <div className="relative">
                            <input type="checkbox" id="exclude-toggle" className="sr-only peer" checked={excludeUnknown} onChange={() => setExcludeUnknown(!excludeUnknown)} />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                </div>

                <div className="px-5">
                    <div style={{ backgroundColor: personaInfo.color }} className={`rounded-3xl p-8 mb-6 shadow-lg text-center flex flex-col items-center`}>
                        {icons[displayedPersona as string] ?
                            <img src={icons[displayedPersona as string]} alt={`${personaInfo.name} icon`} className="w-32 h-32 object-cover rounded-[36px] mb-4"/> :
                            <IconPlaceholder className="w-32 h-32 rounded-[36px] mb-4" />
                        }
                        <h2 className="text-3xl font-bold text-white mb-2">{personaInfo.name}</h2>
                        <p className="text-white text-lg opacity-90 whitespace-pre-line">{personaInfo.description}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
                        <p className="text-base text-gray-800 leading-relaxed text-center">{personaInfo.comment}</p>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">카테고리별 지출</h3>
                        <div className="space-y-4">
                            {Object.entries(displayedAnalysis)
                                .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
                                .map(([cat, amount]) => {
                                    const percentage = displayedTotalSpent > 0 ? (((Number(amount) || 0) / displayedTotalSpent) * 100) : 0;
                                    const categoryPersona = PERSONAS[cat as Category];
                                    const color = categoryPersona ? categoryPersona.color : '#A0AEC0';
                                    
                                    return (
                                        <div key={cat}>
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                                        {icons[cat] ? <img src={icons[cat]} alt={`${cat} icon`} className="w-full h-full object-cover rounded-lg"/> : <IconPlaceholder className="w-8 h-8 rounded-lg" />}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{cat}</span>
                                                </div>
                                                <span className="font-bold text-gray-900">₩{Number(amount || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div className={`h-2.5 rounded-full`} style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                         <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">전체 거래 내역</h3>
                         <ul className="space-y-3">
                             {data
                                .filter(item => !excludeUnknown || item.reclassified !== '알 수 없음')
                                .map((item, index) => (
                                <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {icons[item.reclassified] ? <img src={icons[item.reclassified]} alt={`${item.reclassified} icon`} className="w-full h-full object-cover rounded-lg"/> : <IconPlaceholder className="w-8 h-8 rounded-lg" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.item}</p>
                                            <p className="text-sm text-gray-500">{item.reclassified}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-red-500">- ₩{item.totalSpent.toLocaleString()}</span>
                                </li>
                             ))}
                         </ul>
                    </div>
                </div>
            </main>
            
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-200">
                <div className="max-w-2xl mx-auto">
                    {props.isHistoryView ? (
                        <button
                            onClick={props.onGoBackToHistory}
                            style={{ backgroundColor: PRIMARY_BLUE }}
                            className="w-full text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
                        >
                            <ArrowLeft size={24} />
                            기록으로 돌아가기
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={props.onAddData}
                                style={{ backgroundColor: PRIMARY_BLUE }}
                                className="w-full text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
                            >
                                <PlusCircle size={24} />
                                소비 데이터 추가
                            </button>
                            <button
                                onClick={props.onFinish}
                                style={{ backgroundColor: FINISH_GREEN }}
                                className="w-full text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
                            >
                                <CheckCircle size={24} />
                                저장하고 새로 시작
                            </button>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default ResultPage;