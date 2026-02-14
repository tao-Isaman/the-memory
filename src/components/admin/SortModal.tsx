'use client';

import { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, Plus, Trash2, GripVertical } from 'lucide-react';

export type SortField = 'created_at' | 'memoryCount' | 'paidMemoryCount' | 'creditBalance' | 'user_email' | 'profile';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
    field: SortField;
    order: SortOrder;
}

export interface FilterConfig {
    memories: 'all' | 'with' | 'without';
    paid: 'all' | 'paid' | 'unpaid';
    referral: 'all' | 'with' | 'without';
}

interface SortModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentConfig: SortConfig[];
    currentFilters: FilterConfig;
    onApply: (sort: SortConfig[], filters: FilterConfig) => void;
}

const FIELD_LABELS: Record<SortField, string> = {
    created_at: 'วันที่เข้าร่วม',
    memoryCount: 'จำนวนความทรงจำ',
    paidMemoryCount: 'ความทรงจำที่จ่ายเงิน',
    creditBalance: 'เครดิตคงเหลือ',
    user_email: 'อีเมล',
    profile: 'สถานะโปรไฟล์',
};

export default function SortModal({ isOpen, onClose, currentConfig, currentFilters, onApply }: SortModalProps) {
    const [tempConfig, setTempConfig] = useState<SortConfig[]>([]);
    const [tempFilters, setTempFilters] = useState<FilterConfig>({
        memories: 'all',
        paid: 'all',
        referral: 'all',
    });

    // Sync temp config with current config when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempConfig([...currentConfig]);
            setTempFilters({ ...currentFilters });
        }
    }, [isOpen, currentConfig, currentFilters]);

    if (!isOpen) return null;

    const handleAddField = (field: SortField) => {
        setTempConfig([...tempConfig, { field, order: 'desc' }]);
    };

    const handleRemoveField = (index: number) => {
        const newConfig = [...tempConfig];
        newConfig.splice(index, 1);
        setTempConfig(newConfig);
    };

    const handleToggleOrder = (index: number) => {
        const newConfig = [...tempConfig];
        newConfig[index] = {
            ...newConfig[index],
            order: newConfig[index].order === 'asc' ? 'desc' : 'asc',
        };
        setTempConfig(newConfig);
    };

    const handleApply = () => {
        onApply(tempConfig, tempFilters);
        onClose();
    };

    // Get unused fields
    const getUnusedFields = () => {
        const usedFields = new Set(tempConfig.map((item) => item.field));
        const allFields = Object.keys(FIELD_LABELS) as SortField[];
        return allFields.filter((f) => !usedFields.has(f));
    };

    const unusedFields = getUnusedFields();

    const FilterSection = ({ title, options, value, onChange }: {
        title: string,
        options: { value: string, label: string }[],
        value: string,
        onChange: (val: any) => void
    }) => (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${value === opt.value
                                ? 'bg-pink-500 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">ตัวกรองและจัดเรียง</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Filters */}
                    <div className="space-y-4 pb-4 border-b border-gray-100">
                        <FilterSection
                            title="ความทรงจำ"
                            value={tempFilters.memories}
                            onChange={(val) => setTempFilters(prev => ({ ...prev, memories: val }))}
                            options={[
                                { value: 'all', label: 'ทั้งหมด' },
                                { value: 'with', label: 'มีความทรงจำ' },
                                { value: 'without', label: 'ไม่มีความทรงจำ' },
                            ]}
                        />
                        <FilterSection
                            title="การชำระเงิน"
                            value={tempFilters.paid}
                            onChange={(val) => setTempFilters(prev => ({ ...prev, paid: val }))}
                            options={[
                                { value: 'all', label: 'ทั้งหมด' },
                                { value: 'paid', label: 'จ่ายแล้ว' },
                                { value: 'unpaid', label: 'ยังไม่จ่าย' },
                            ]}
                        />
                        <FilterSection
                            title="การแนะนำเพื่อน"
                            value={tempFilters.referral}
                            onChange={(val) => setTempFilters(prev => ({ ...prev, referral: val }))}
                            options={[
                                { value: 'all', label: 'ทั้งหมด' },
                                { value: 'with', label: 'มีโค้ดแนะนำ' },
                                { value: 'without', label: 'ไม่มีโค้ดแนะนำ' },
                            ]}
                        />
                    </div>

                    {/* Active Sorts */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">ลำดับการเรียงปัจจุบัน</h3>
                        {tempConfig.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                ยังไม่ได้เลือกเงื่อนไขการเรียง
                            </div>
                        ) : (
                            tempConfig.map((item, index) => (
                                <div
                                    key={`${item.field}-${index}`}
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                                >
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                        {index + 1}
                                    </span>

                                    <div className="flex-1 font-medium text-gray-700">
                                        {FIELD_LABELS[item.field]}
                                    </div>

                                    <button
                                        onClick={() => handleToggleOrder(index)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${item.order === 'asc'
                                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                            }`}
                                    >
                                        {item.order === 'asc' ? (
                                            <>
                                                <ArrowUp size={14} /> น้อยไปมาก
                                            </>
                                        ) : (
                                            <>
                                                <ArrowDown size={14} /> มากไปน้อย
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleRemoveField(index)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Available Fields */}
                    {unusedFields.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">เพิ่มเงื่อนไขการเรียง</h3>
                            <div className="flex flex-wrap gap-2">
                                {unusedFields.map((field) => (
                                    <button
                                        key={field}
                                        onClick={() => handleAddField(field)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-600 border border-gray-200 hover:border-pink-200 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Plus size={14} />
                                        {FIELD_LABELS[field]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg font-medium transition-colors border border-transparent hover:border-gray-200"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors shadow-sm focus:ring-4 focus:ring-pink-100"
                    >
                        ตกลง
                    </button>
                </div>
            </div>
        </div>
    );
}
