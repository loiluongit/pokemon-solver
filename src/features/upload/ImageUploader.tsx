interface ImageUploaderProps {
  onFileSelected: (file: File) => void
}

export const ImageUploader = ({ onFileSelected }: ImageUploaderProps) => {
  return (
    <label className="uploader">
      <span>Upload Onet screenshot</span>
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

