
import React, { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { analyzeTransactionImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { Page, Transaction, AnalysisResult, Persona, Category, AnalysisVersion } from './types';
import UploadPage from './components/UploadPage';
import ResultPage from './components/ResultPage';
import AddDataPage from './components/AddDataPage';
import HistoryPage from './components/HistoryPage';
import { getHistory, saveToHistory, deleteFromHistory } from './utils/versionHistory';

const CATEGORY_MAPPING: { [key: string]: Category } = {
    // 식비
    '음식': '식비', '식사': '식비', '식비': '식비', '식료품': '식비', '카페': '식비', '배달': '식비', '디저트': '식비', '간식': '식비',
    'groceries': '식비', 'food': '식비', 'cafe': '식비', 'restaurant': '식비',
    // 주거
    '주거': '주거', '월세': '주거', '관리비': '주거', '전기': '주거', '수도': '주거', '가스': '주거', '인터넷': '주거', '통신': '주거',
    'housing': '주거', 'utilities': '주거', 'rent': '주거',
    // 교통비
    '교통': '교통비', '교통비': '교통비', '택시': '교통비', '버스': '교통비', '지하철': '교통비', '주차': '교통비', '기름': '교통비', '항공': '교통비', 'ktx': '교통비',
    'transportation': '교통비', 'travel': '교통비', 'taxi': '교통비', 'bus': '교통비', 'subway': '교통비',
    // 쇼핑
    '쇼핑': '쇼핑', '의류': '쇼핑', '화장품': '쇼핑', '전자제품': '쇼핑', '선물': '쇼핑', '가구': '쇼핑', '인테리어': '쇼핑', '편의점': '쇼핑', '마트': '쇼핑',
    'shopping': '쇼핑', 'gifts': '쇼핑', 'clothes': '쇼핑', 'cosmetics': '쇼핑',
    // 문화/여가
    '문화': '문화/여가', '여가': '문화/여가', '운동': '문화/여가', '헬스': '문화/여가', '취미': '문화/여가', '영화': '문화/여가', '공연': '문화/여가', '여행': '문화/여가', '구독': '문화/여가',
    'fitness': '문화/여가', 'hobbies': '문화/여가', 'culture': '문화/여가', 'leisure': '문화/여가',
    // 생활비
    '생활': '생활비', '의료': '생활비', '병원': '생활비', '약국': '생활비', '생필품': '생활비', '미용': '생활비', '경조사': '생활비',
    'medical': '생활비', 'dental': '생활비', 'personal hygiene': '생활비',
};

const ITEM_MAPPING: { [key: string]: Category } = {
    // 식비
    '우유': '식비', '빵': '식비', '치킨': '식비', '과자': '식비', '라면': '식비', '커피': '식비', '점심': '식비', '저녁': '식비', '피자': '식비', '햄버거': '식비', '스타벅스': '식비', '배달의민족': '식비', '요기요': '식비', '마켓컬리': '식비',
    'milk': '식비', 'bread': '식비', 'chicken': '식비', 'snacks': '식비', 'coffee': '식비', 'lunch': '식비', 'dinner': '식비', 'pizza': '식비',
    // 주거
    '월세': '주거', '관리비': '주거', '전기세': '주거', '수도세': '주거', '가스비': '주거', '인터넷': '주거', '통신비': '주거', 'kt': '주거', 'skt': '주거', 'lgu+': '주거',
    'rent': '주거', 'electric bill': '주거', 'water bill': '주거', 'gas bill': '주거', 'internet bill': '주거',
    // 교통비
    '택시': '교통비', '버스': '교통비', '지하철': '교통비', '주차': '교통비', '기름': '교통비', '카카오택시': '교통비', '티머니': '교통비', '하이패스': '교통비', 'srt': '교통비',
    'taxi': '교통비', 'bus': '교통비', 'subway': '교통비', 'parking': '교통비', 'gas': '교통비',
    // 쇼핑
    '옷': '쇼핑', '신발': '쇼핑', '가방': '쇼핑', '화장품': '쇼핑', '핸드폰': '쇼핑', '올리브영': '쇼핑', '무신사': '쇼핑', '쿠팡': '쇼핑', '네이버쇼핑': '쇼핑', '이마트': '쇼핑', '홈플러스': '쇼핑', '다이소': '쇼핑', 'cu': '쇼핑', 'gs25': '쇼핑', '세븐일레븐': '쇼핑',
    'clothes': '쇼핑', 'shoes': '쇼핑', 'cosmetics': '쇼핑', 'coupang': '쇼핑', 'book': '쇼핑',
    // 문화/여가
    '영화': '문화/여가', '헬스': '문화/여가', '노래방': '문화/여가', 'pc방': '문화/여가', 'cgv': '문화/여가', '메가박스': '문화/여가', '넷플릭스': '문화/여가', '유튜브': '문화/여가', '멜론': '문화/여가', '교보문고': '문화/여가',
    'movie': '문화/여가', 'gym': '문화/여가', 'netflix': '문화/여가', 'youtube': '문화/여가',
    // 생활비
    '병원': '생활비', '약': '생활비', '샴푸': '생활비', '미용실': '생활비',
    'hospital': '생활비', 'pharmacy': '생활비', 'shampoo': '생활비'
};

const categorizeTransaction = (item: string, originalCategory: string): Category => {
    if (!item) return '알 수 없음';
    const normalizedItem = item.toLowerCase();
    
    // 1. Check item mapping for exact or partial matches
    for (const [key, category] of Object.entries(ITEM_MAPPING)) {
        if (normalizedItem.includes(key.toLowerCase())) {
            return category;
        }
    }
    
    // 2. Check category mapping with the item name
    for (const [key, category] of Object.entries(CATEGORY_MAPPING)) {
        if (normalizedItem.includes(key.toLowerCase())) {
            return category;
        }
    }
    
    // 3. If originalCategory is valid, use it
    if (['식비', '쇼핑', '주거', '교통비', '문화/여가', '생활비'].includes(originalCategory)) {
        return originalCategory as Category;
    }
    
    // 4. Default to '알 수 없음'
    return '알 수 없음';
};

export const PERSONAS: { [key: string]: Persona } = {
    '식비': { name: '미식가', iconPrompt: 'A fork and knife crossed', color: '#FFB800', description: '맛있는 음식을 즐기는 데\n지출이 많으시네요', comment: '다양한 맛을 탐험하는 당신은 진정한 미식가입니다.' },
    '쇼핑': { name: '쇼핑 러버', iconPrompt: 'A shopping bag with a small heart on it', color: '#FF6482', description: '쇼핑을 통해 삶의 만족도를\n높이시는군요', comment: '새로운 것을 찾는 즐거움을 아는 당신, 멋져요!' },
    '주거': { name: '홈 메이커', iconPrompt: 'A simple, modern house icon', color: '#00C471', description: '주거 관련 지출이 소비에서\n큰 비중을 차지하네요', comment: '편안한 공간을 만드는 데 투자하는 현명한 선택입니다.' },
    '교통비': { name: '액티브 무버', iconPrompt: 'A modern bus or subway icon', color: '#3182F6', description: '이동이 잦거나 교통 관련\n지출이 많은 편이시네요', comment: '세상을 누비는 활동적인 라이프스타일!' },
    '문화/여가': { name: '라이프 엔조이어', iconPrompt: 'A movie ticket and a star', color: '#8B5CF6', description: '다양한 문화 및 여가 활동에\n적극적으로 참여하시는군요', comment: '삶을 풍요롭게 만드는 멋진 취미생활을 하고 계세요.' },
    '생활비': { name: '라이프 매니저', iconPrompt: 'A water droplet inside a leaf shape', color: '#14B8A6', description: '필수적인 생활비 지출이\n상대적으로 높게 나타납니다', comment: '건강과 일상을 챙기는 책임감 있는 당신, 응원합니다.' },
    '알 수 없음': { name: '미스터리 소비자', iconPrompt: 'A magnifying glass over a question mark', color: '#A0AEC0', description: '분류하기 어려운 소비가\n많이 발견되었습니다', comment: '독특한 소비 패턴을 가진 흥미로운 당신이네요.' },
    '생각없는 직진가': { name: '생각없는 직진가', iconPrompt: 'A cartoon rocket ship about to crash into a planet', color: '#F44336', description: '잘못된 데이터를 포함하여\n분석을 요청하셨습니다', comment: '잘못된 데이터는 인식할 수 없어요. 정확한 분석을 위해 올바른 형식의 데이터를 업로드해주세요!' }
};

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('upload');
    const [data, setData] = useState<Transaction[]>([]);
    const [persona, setPersona] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [newlyAddedCount, setNewlyAddedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [versions, setVersions] = useState<AnalysisVersion[]>([]);
    const [viewingVersion, setViewingVersion] = useState<AnalysisVersion | null>(null);

    useEffect(() => {
        setVersions(getHistory());
    }, []);

    const analyzeData = useCallback((dataToAnalyze: Transaction[]) => {
        if (dataToAnalyze.length === 0) {
            setPersona(null);
            setAnalysis(null);
            return;
        }

        const categoryTotals: AnalysisResult = {};
        dataToAnalyze.forEach(row => {
            const cat = row.reclassified;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + row.totalSpent;
        });

        const sorted = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

        if (sorted.length > 0) {
            const topCategory = sorted[0][0];
            setPersona(topCategory);
            setAnalysis(categoryTotals);
        }
    }, []);

    const processAndSetData = useCallback((newTransactions: Omit<Transaction, 'reclassified'>[]) => {
        const processed = newTransactions.map(t => ({
            ...t,
            reclassified: categorizeTransaction(t.item, t.category)
        }));

        setData(prevData => {
            const updatedData = [...prevData, ...processed];
            analyzeData(updatedData);
            return updatedData;
        });
        setNewlyAddedCount(processed.length);
        return processed.length;
    }, [analyzeData]);

    const handleFileUpload = (file: File) => {
        setIsLoading(true);
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'csv' || fileExtension === 'txt') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedData = (results.data as any[]).map(row => ({
                        category: row.Category || row.카테고리 || '알 수 없음',
                        item: row.Item || row.항목,
                        totalSpent: Math.abs(parseFloat(row['Total Spent'] || row.금액 || '0'))
                    })).filter(d => d.item && d.totalSpent > 0);
                    processAndSetData(parsedData);
                    setIsLoading(false);
                },
                error: (err) => {
                    console.error("CSV/TXT parsing error:", err);
                    alert('파일을 처리하는 중 오류가 발생했습니다.');
                    setIsLoading(false);
                }
            });
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target?.result, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
                    const parsedData = jsonData.map(row => ({
                        category: row.Category || row.카테고리 || '알 수 없음',
                        item: row.Item || row.항목,
                        totalSpent: Math.abs(parseFloat(row['Total Spent'] || row.금액 || '0'))
                    })).filter(d => d.item && d.totalSpent > 0);
                    processAndSetData(parsedData);
                } catch (err) {
                    console.error("Excel parsing error:", err);
                    alert('Excel 파일을 처리하는 중 오류가 발생했습니다.');
                } finally {
                    setIsLoading(false);
                }
            };
            reader.onerror = () => {
                 alert('파일을 읽는 중 오류가 발생했습니다.');
                 setIsLoading(false);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert(`지원하지 않는 파일 형식입니다: .${fileExtension}\nCSV, Excel, TXT 파일을 업로드해주세요.`);
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (files: File[]) => {
        setIsLoading(true);
        let allNewTransactions: Transaction[] = [];
        let hasInvalidImage = false;

        for (const file of files) {
            const base64Image = await fileToBase64(file);
            const result = await analyzeTransactionImage(base64Image, file.type);
            
            if (!result.isFinancial) {
                hasInvalidImage = true;
                break;
            }
            const transactionsFromImage = result.transactions.map(t => ({
                item: t.item,
                totalSpent: Math.abs(t.amount),
                category: t.category,
                reclassified: t.category
            }));
            allNewTransactions.push(...transactionsFromImage);
        }
        
        setIsLoading(false);

        if (hasInvalidImage) {
            return { valid: false, count: 0 };
        }
        
        setData(prev => {
            const updated = [...prev, ...allNewTransactions];
            analyzeData(updated);
            return updated;
        });
        setNewlyAddedCount(allNewTransactions.length);
        return { valid: true, count: allNewTransactions.length };
    };

    const handleGoToResult = () => {
        if (persona === '생각없는 직진가') {
             setAnalysis({ '알 수 없음': 1 });
        }
        setViewingVersion(null);
        setCurrentPage('result');
    };

    const handleSetRusherPersona = () => {
        setPersona('생각없는 직진가');
        handleGoToResult();
    };

    const handleSaveAndFinish = () => {
        const newVersion: AnalysisVersion = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            data,
            persona,
            analysis,
        };
        saveToHistory(newVersion);
        setVersions(getHistory());

        setData([]);
        setPersona(null);
        setAnalysis(null);
        setCurrentPage('upload');
    };

    const handleViewVersion = (id: string) => {
        const versionToView = versions.find(v => v.id === id);
        if (versionToView) {
            setViewingVersion(versionToView);
            setCurrentPage('result');
        }
    };
    
    const handleDeleteVersion = (id: string) => {
        deleteFromHistory(id);
        setVersions(getHistory());
    };

    const CurrentPageComponent = () => {
        switch (currentPage) {
            case 'upload':
                return <UploadPage 
                            dataCount={data.length} 
                            onFileUpload={handleFileUpload} 
                            onImageUpload={handleImageUpload}
                            onProcessTextData={(d) => processAndSetData(d)}
                            onGoToResult={handleGoToResult}
                            onSetRusherPersona={handleSetRusherPersona}
                            onGoToHistory={() => setCurrentPage('history')}
                            isLoading={isLoading}
                        />;
            case 'result':
                const resultProps = viewingVersion
                    ? {
                        persona: viewingVersion.persona,
                        analysis: viewingVersion.analysis,
                        data: viewingVersion.data,
                        isHistoryView: true as const,
                        onGoBackToHistory: () => {
                            setViewingVersion(null);
                            setCurrentPage('history');
                        }
                      }
                    : {
                        persona: persona,
                        analysis: analysis,
                        data: data,
                        isHistoryView: false as const,
                        onAddData: () => setCurrentPage('add'),
                        onFinish: handleSaveAndFinish,
                      };
                return <ResultPage {...resultProps} />;
            case 'add':
                 return <AddDataPage
                            dataCount={data.length}
                            newlyAddedCount={newlyAddedCount}
                            onFileUpload={handleFileUpload}
                            onImageUpload={handleImageUpload}
                            onProcessTextData={(d) => processAndSetData(d)}
                            onGoToResult={() => setCurrentPage('result')}
                            isLoading={isLoading}
                        />;
            case 'history':
                return <HistoryPage
                            versions={versions}
                            onViewVersion={handleViewVersion}
                            onDeleteVersion={handleDeleteVersion}
                            onGoBack={() => setCurrentPage('upload')}
                        />;
            default:
                return <div>Page not found</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <CurrentPageComponent />
        </div>
    );
};

export default App;
