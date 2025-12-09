interface Props {
    file: File;
    label: string;
}

export function ImagePreview({ file, label }: Props) {
    const url = URL.createObjectURL(file);

    return (
        <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img
                src={url}
                alt={label}
                className="w-full h-full object-cover"
                onLoad={() => URL.revokeObjectURL(url)}
            />
            <div className="absolute inset-0 bg-black/40 flex items-end p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-medium truncate w-full text-center">
                    {label}
                </span>
            </div>
        </div>
    );
}
