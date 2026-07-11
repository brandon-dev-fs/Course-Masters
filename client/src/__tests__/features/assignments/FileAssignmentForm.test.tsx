import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileAssignmentForm from '../../../features/assignments/FileAssignmentForm.js';

const defaultProps = {
  file: null,
  onFileChange: vi.fn(),
  uploadProgress: null,
  existingFile: null,
  error: '',
  onErrorChange: vi.fn(),
};

function makeFile(name: string, type: string, sizeBytes = 1024): File {
  const file = new File(['x'.repeat(sizeBytes)], name, { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

describe('FileAssignmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Render states ─────────────────────────────────────────────────────────

  it('renders Choose file button when no file and no existingFile', () => {
    render(<FileAssignmentForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument();
    expect(screen.getByText(/accepted: pdf/i)).toBeInTheDocument();
  });

  it('renders selected file info and Change button when file is provided', () => {
    const file = makeFile('report.pdf', 'application/pdf', 2048);
    render(<FileAssignmentForm {...defaultProps} file={file} />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    // Choose file button should not appear
    expect(screen.queryByRole('button', { name: /choose file/i })).not.toBeInTheDocument();
  });

  it('renders existing file info when existingFile provided and no new file', () => {
    const existing = { id: 'f1', assignmentId: 'a1', filename: 'lecture.pdf', mimeType: 'application/pdf', sizeBytes: 5 * 1024 * 1024 };
    render(<FileAssignmentForm {...defaultProps} existingFile={existing} />);
    expect(screen.getByText('lecture.pdf')).toBeInTheDocument();
    expect(screen.getByText('5.0 MB')).toBeInTheDocument();
    expect(screen.getByText(/current file/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /choose file/i })).not.toBeInTheDocument();
  });

  it('new file takes priority over existingFile', () => {
    const file = makeFile('new.pdf', 'application/pdf');
    const existing = { id: 'f1', assignmentId: 'a1', filename: 'old.pdf', mimeType: 'application/pdf', sizeBytes: 1024 };
    render(<FileAssignmentForm {...defaultProps} file={file} existingFile={existing} />);
    expect(screen.getByText('new.pdf')).toBeInTheDocument();
    expect(screen.queryByText('old.pdf')).not.toBeInTheDocument();
  });

  // ── Upload progress ───────────────────────────────────────────────────────

  it('renders progress bar when uploadProgress is a number', () => {
    render(<FileAssignmentForm {...defaultProps} uploadProgress={42} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('42% uploaded')).toBeInTheDocument();
  });

  it('does not render progress bar when uploadProgress is null', () => {
    render(<FileAssignmentForm {...defaultProps} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  // ── Error display ─────────────────────────────────────────────────────────

  it('displays error message when error prop is non-empty', () => {
    render(<FileAssignmentForm {...defaultProps} error="File is too large" />);
    expect(screen.getByText('File is too large')).toBeInTheDocument();
  });

  it('does not render error when error prop is empty', () => {
    render(<FileAssignmentForm {...defaultProps} />);
    expect(screen.queryByText(/file is too large/i)).not.toBeInTheDocument();
  });

  // ── File validation ───────────────────────────────────────────────────────

  it('calls onErrorChange with type error for disallowed MIME type', () => {
    const onErrorChange = vi.fn();
    render(<FileAssignmentForm {...defaultProps} onErrorChange={onErrorChange} />);
    const input = screen.getByLabelText('Choose a file to upload');
    const bad = makeFile('image.png', 'image/png');
    fireEvent.change(input, { target: { files: [bad] } });
    expect(onErrorChange).toHaveBeenCalledWith(expect.stringMatching(/invalid file type/i));
    expect(defaultProps.onFileChange).not.toHaveBeenCalled();
  });

  it('calls onErrorChange with size error when file exceeds 10 MB', () => {
    const onErrorChange = vi.fn();
    render(<FileAssignmentForm {...defaultProps} onErrorChange={onErrorChange} />);
    const input = screen.getByLabelText('Choose a file to upload');
    const tooBig = makeFile('huge.pdf', 'application/pdf', 11 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [tooBig] } });
    expect(onErrorChange).toHaveBeenCalledWith(expect.stringMatching(/too large/i));
    expect(defaultProps.onFileChange).not.toHaveBeenCalled();
  });

  it('clears error and calls onFileChange for a valid PDF', () => {
    const onFileChange = vi.fn();
    const onErrorChange = vi.fn();
    render(<FileAssignmentForm {...defaultProps} onFileChange={onFileChange} onErrorChange={onErrorChange} />);
    const input = screen.getByLabelText('Choose a file to upload');
    const valid = makeFile('notes.pdf', 'application/pdf', 1024);
    fireEvent.change(input, { target: { files: [valid] } });
    expect(onErrorChange).toHaveBeenCalledWith('');
    expect(onFileChange).toHaveBeenCalledWith(valid);
  });

  it('accepts DOCX files', () => {
    const onFileChange = vi.fn();
    render(<FileAssignmentForm {...defaultProps} onFileChange={onFileChange} />);
    const input = screen.getByLabelText('Choose a file to upload');
    const docx = makeFile('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    fireEvent.change(input, { target: { files: [docx] } });
    expect(onFileChange).toHaveBeenCalledWith(docx);
  });

  it('accepts TXT files', () => {
    const onFileChange = vi.fn();
    render(<FileAssignmentForm {...defaultProps} onFileChange={onFileChange} />);
    const input = screen.getByLabelText('Choose a file to upload');
    const txt = makeFile('notes.txt', 'text/plain');
    fireEvent.change(input, { target: { files: [txt] } });
    expect(onFileChange).toHaveBeenCalledWith(txt);
  });

  it('does nothing when no file is selected (empty files list)', () => {
    const onFileChange = vi.fn();
    const onErrorChange = vi.fn();
    render(<FileAssignmentForm {...defaultProps} onFileChange={onFileChange} onErrorChange={onErrorChange} />);
    const input = screen.getByLabelText('Choose a file to upload');
    fireEvent.change(input, { target: { files: [] } });
    expect(onFileChange).not.toHaveBeenCalled();
    expect(onErrorChange).not.toHaveBeenCalled();
  });

  // ── formatFileSize display ────────────────────────────────────────────────

  it('shows size in B for files under 1 KB', () => {
    const file = makeFile('tiny.txt', 'text/plain', 512);
    render(<FileAssignmentForm {...defaultProps} file={file} />);
    expect(screen.getByText('512 B')).toBeInTheDocument();
  });

  it('shows size in KB for files between 1 KB and 1 MB', () => {
    const file = makeFile('small.pdf', 'application/pdf', 2048);
    render(<FileAssignmentForm {...defaultProps} file={file} />);
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('shows size in MB for files 1 MB and above', () => {
    const file = makeFile('big.pdf', 'application/pdf', 3 * 1024 * 1024);
    render(<FileAssignmentForm {...defaultProps} file={file} />);
    expect(screen.getByText('3.0 MB')).toBeInTheDocument();
  });
});
