import type { AnalysisVersion } from '../types';

const HISTORY_KEY = 'spendy_analysis_history';

export const getHistory = (): AnalysisVersion[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        if (historyJson) {
            const history = JSON.parse(historyJson) as AnalysisVersion[];
            // Sort by date, newest first
            return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return [];
    } catch (error) {
        console.error("Error retrieving history from localStorage:", error);
        return [];
    }
};

export const saveToHistory = (version: AnalysisVersion): void => {
    try {
        const history = getHistory();
        // Prepending the new version to the start of the array
        const updatedHistory = [version, ...history.filter(h => h.id !== version.id)];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Error saving to history in localStorage:", error);
    }
};

export const deleteFromHistory = (versionId: string): void => {
    try {
        const history = getHistory();
        const updatedHistory = history.filter(v => v.id !== versionId);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Error deleting from history in localStorage:", error);
    }
};
