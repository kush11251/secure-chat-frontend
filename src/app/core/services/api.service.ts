import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getHealth() {
    return this.http.get<{ status: string }>(`${this.base}/health`, { withCredentials: true });
  }
}
