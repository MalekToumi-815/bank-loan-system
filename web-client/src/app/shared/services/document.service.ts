import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentDTO } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getLoanDocuments(loanId: number): Observable<DocumentDTO[]> {
    return this.http.get<DocumentDTO[]>(`${this.baseUrl}credit/documents/loan/${loanId}`);
  }

  getDocumentUrl(documentId: number, preview: boolean): Observable<{url: string}> {
    return this.http.get<{url: string}>(`${this.baseUrl}credit/documents/${documentId}/url?preview=${preview}`);
  }
}
