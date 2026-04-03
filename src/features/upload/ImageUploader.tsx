interface ImageUploaderProps {
  onFileSelected: (file: File) => void
}

export const ImageUploader = ({ onFileSelected }: ImageUploaderProps) => {
  return (
    <label className="uploader">
      <div className="uploader-content">
        <strong className="uploader-title">Choose Onet screenshot</strong>
        <span className="uploader-sub">Drop or click to select a screenshot</span>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) onFileSelected(file)
        }}
      />
    </label>
  )
}

