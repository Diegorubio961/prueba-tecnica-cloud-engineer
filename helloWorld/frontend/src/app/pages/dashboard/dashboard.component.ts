import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <nav class="topbar">
        <span class="brand">&#127760; HelloWorld</span>
        <div class="user-section">
          <div class="avatar">{{ initial }}</div>
          <span class="username">{{ user?.name }}</span>
          <button mat-stroked-button class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main class="content">
        <div class="greeting">
          <span class="greeting-label">Hola de nuevo,</span>
          <span class="greeting-name">{{ user?.name }} &#128075;</span>
        </div>

        <div class="hello-card">
          <div class="hello-badge">Mensaje para ti</div>
          <h1 class="hello-text">Hello, World!</h1>
          <p class="hello-sub">Has iniciado sesión exitosamente.<br>El mundo es tuyo.</p>
          <div class="confetti">
            <span>&#127881;</span>
            <span>&#11088;</span>
            <span>&#127775;</span>
          </div>
        </div>

        <div class="info-cards">
          <div class="info-card">
            <mat-icon class="info-icon">person</mat-icon>
            <div>
              <div class="info-label">Usuario</div>
              <div class="info-value">{{ user?.name }}</div>
            </div>
          </div>
          <div class="info-card">
            <mat-icon class="info-icon">email</mat-icon>
            <div>
              <div class="info-label">Email</div>
              <div class="info-value">{{ user?.email }}</div>
            </div>
          </div>
          <div class="info-card">
            <mat-icon class="info-icon">verified_user</mat-icon>
            <div>
              <div class="info-label">Estado</div>
              <div class="info-value status">Autenticado &#10003;</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f1f5f9;
    }

    /* Topbar */
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2.5rem;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      font-size: 1.35rem;
      font-weight: 800;
      color: #6366f1;
    }
    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
    }
    .username {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.95rem;
    }
    .logout-btn {
      border-color: #e2e8f0 !important;
      color: #64748b !important;
      gap: 0.25rem;
      font-size: 0.875rem !important;
    }
    .logout-btn:hover {
      border-color: #ef4444 !important;
      color: #ef4444 !important;
    }

    /* Content */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1.5rem 4rem;
      gap: 2.5rem;
    }

    /* Greeting */
    .greeting {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .greeting-label {
      font-size: 1rem;
      color: #64748b;
    }
    .greeting-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    /* Hello Card */
    .hello-card {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
      border-radius: 2rem;
      padding: 4rem 3rem;
      text-align: center;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 20px 40px rgba(99,102,241,0.35);
      position: relative;
      overflow: hidden;
    }
    .hello-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
    }
    .hello-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 0.35rem 1rem;
      border-radius: 999px;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(4px);
    }
    .hello-text {
      font-size: clamp(3rem, 8vw, 5.5rem);
      font-weight: 800;
      color: white;
      letter-spacing: -2px;
      line-height: 1;
      margin-bottom: 1rem;
      text-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .hello-sub {
      color: rgba(255,255,255,0.85);
      font-size: 1.1rem;
      line-height: 1.6;
    }
    .confetti {
      margin-top: 1.5rem;
      font-size: 1.75rem;
      letter-spacing: 0.5rem;
      animation: pop 0.6s ease-out;
    }
    @keyframes pop {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Info Cards */
    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      width: 100%;
      max-width: 700px;
    }
    .info-card {
      background: white;
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .info-icon {
      color: #6366f1;
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
    }
    .info-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      word-break: break-all;
    }
    .status { color: #16a34a; }

    @media (max-width: 600px) {
      .topbar { padding: 0.875rem 1.25rem; }
      .username { display: none; }
      .hello-card { padding: 3rem 1.5rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  initial = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      this.initial = user?.name?.charAt(0).toUpperCase() ?? '?';
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
