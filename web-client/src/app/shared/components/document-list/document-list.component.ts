import { Component, input, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';
import { DocumentDTO } from '../../models/document.model';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './document-list.component.css',
  template: `
    <div class="document-list-container">
      @if (loading()) {
        <div class="document-list-message">Loading documents...</div>
      } @else if (error()) {
        <div class="document-list-message error">{{ error() }}</div>
      } @else if (documents().length === 0) {
        <div class="document-list-message empty">No documents available for this loan.</div>
      } @else {
        <ul class="document-list">
          @for (doc of documents(); track doc.id) {
            <li class="document-item">
              <div class="document-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="document-info">
                <span class="document-name" [title]="getOriginalFilename(doc.filepath)">
                  {{ getOriginalFilename(doc.filepath) }}
                </span>
                <span class="document-date">{{ doc.date | date:'shortDate' }}</span>
              </div>
              <div class="document-actions">
                <button type="button" class="action-btn" title="Preview" (click)="previewDocument(doc)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button type="button" class="action-btn" title="Download" (click)="downloadDocument(doc)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class DocumentListComponent {
  loanId = input.required<number>();
  
  private documentService = inject(DocumentService);
  
  documents = signal<DocumentDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.loanId();
      if (id) {
        this.loadDocuments(id);
      }
    });
  }

  private loadDocuments(loanId: number) {
    this.loading.set(true);
    this.error.set(null);
    this.documentService.getLoanDocuments(loanId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load documents.');
        this.loading.set(false);
      }
    });
  }

  getOriginalFilename(filepath: string): string {
    if (!filepath) return 'Unknown File';
    const parts = filepath.split('/');
    const lastPart = parts[parts.length - 1];
    const underscoreIndex = lastPart.indexOf('_');
    if (underscoreIndex !== -1) {
      return lastPart.substring(underscoreIndex + 1);
    }
    return lastPart;
  }

  previewDocument(doc: DocumentDTO) {
    this.documentService.getDocumentUrl(doc.id, true).subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: () => {
        console.error('Failed to get preview URL');
      }
    });
  }

  downloadDocument(doc: DocumentDTO) {
    this.documentService.getDocumentUrl(doc.id, false).subscribe({
      next: (response) => {
        const a = document.createElement('a');
        a.href = response.url;
        a.download = this.getOriginalFilename(doc.filepath);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: () => {
        console.error('Failed to get download URL');
      }
    });
  }
}
