import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, from, tap } from 'rxjs';
import { OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';
import { Inject } from '@angular/core';
import OktaAuth from '@okta/okta-auth-js';
import { environment } from '../../../environments/environment';

export interface User {
  id: number | string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface JwtPayload {
  id: number;
  name: string;
  email: string;
  exp: number;
  iat: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'hw_token';
  private readonly apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth,
    private oktaAuthState: OktaAuthStateService,
  ) {
    // Sync Okta auth state with our user subject
    this.oktaAuthState.authState$.subscribe(async (state) => {
      if (state.isAuthenticated) {
        const info = await this.oktaAuth.getUser();
        const oktaUser: User = {
          id:    info.sub ?? '',
          name:  info.name ?? info.email ?? '',
          email: info.email ?? '',
        };
        this.currentUserSubject.next(oktaUser);
      } else if (!this.getStoredUser()) {
        this.currentUserSubject.next(null);
      }
    });
  }

  // ── Local auth (email + password) ──────────────────────────

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, { name, email, password })
      .pipe(tap((res) => this.storeSession(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.storeSession(res)));
  }

  // ── Okta auth ───────────────────────────────────────────────

  loginWithOkta(): Observable<void> {
    return from(this.oktaAuth.signInWithRedirect());
  }

  // ── Shared ──────────────────────────────────────────────────

  async logout(): Promise<void> {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);

    // If user came via Okta, sign out from Okta too
    const isOkta = await this.oktaAuth.isAuthenticated();
    if (isOkta) {
      await this.oktaAuth.signOut();
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodePayload(token);
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken() ?? ''}` });
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    this.currentUserSubject.next(res.user);
  }

  private getStoredUser(): User | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    const payload = this.decodePayload(token);
    if (!payload || payload.exp * 1000 <= Date.now()) return null;
    return { id: payload.id, name: payload.name, email: payload.email };
  }

  private decodePayload(token: string): JwtPayload | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
