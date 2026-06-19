import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="page">
      <div class="card">
        <div class="card-header">
          <a routerLink="/" class="logo">&#127760; HelloWorld</a>
          <h1>Bienvenido de vuelta</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
          <mat-form-field appearance="outline" class="field">
            <mat-label>Correo electrónico</mat-label>
            <input matInput type="email" formControlName="email" placeholder="tu@email.com" autocomplete="email">
            <mat-icon matPrefix>email</mat-icon>
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <mat-error>Ingresa un email válido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
            }
          </mat-form-field>

          @if (errorMessage) {
            <div class="error-alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="submit-btn"
            [disabled]="loading || form.invalid"
          >
            @if (loading) {
              <mat-spinner diameter="20" />
            } @else {
              Iniciar Sesión
            }
          </button>
        </form>

        <mat-divider class="divider"></mat-divider>
        <p class="divider-label">o continúa con</p>

        <button
          mat-stroked-button
          type="button"
          class="okta-btn"
          (click)="loginWithOkta()"
          [disabled]="loading"
        >
          <svg class="okta-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" fill="#007DC1"/>
          </svg>
          Iniciar sesión con Okta SSO
        </button>

        <p class="footer-link">
          ¿No tienes cuenta? <a routerLink="/register">Regístrate gratis</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
      padding: 2rem 1rem;
    }
    .card {
      background: white;
      border-radius: 1.5rem;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.2);
    }
    .card-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo {
      display: inline-block;
      font-size: 1.25rem;
      font-weight: 800;
      color: #6366f1;
      text-decoration: none;
      margin-bottom: 1.25rem;
    }
    .card-header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.375rem;
    }
    .card-header p {
      color: #64748b;
      font-size: 0.9rem;
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .field {
      width: 100%;
    }
    .error-alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      color: #dc2626;
      font-size: 0.875rem;
    }
    .error-alert mat-icon {
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
      flex-shrink: 0;
    }
    .submit-btn {
      margin-top: 0.5rem;
      height: 48px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 8px !important;
    }
    .submit-btn mat-spinner {
      display: inline-block;
    }
    .footer-link {
      text-align: center;
      margin-top: 1.5rem;
      color: #64748b;
      font-size: 0.9rem;
    }
    .footer-link a {
      color: #6366f1;
      font-weight: 600;
      text-decoration: none;
    }
    .footer-link a:hover { text-decoration: underline; }
    .divider { margin: 1.25rem 0 0; }
    .divider-label {
      text-align: center;
      color: #94a3b8;
      font-size: 0.8rem;
      margin: 0.5rem 0 0.75rem;
    }
    .okta-btn {
      width: 100%;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border-color: #cbd5e1 !important;
      color: #1e293b !important;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 8px !important;
    }
    .okta-btn:hover { border-color: #007DC1 !important; color: #007DC1 !important; }
    .okta-logo { width: 20px; height: 20px; flex-shrink: 0; }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const email = this.form.get('email')?.value as string;
    const password = this.form.get('password')?.value as string;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al iniciar sesión. Intenta de nuevo.';
        this.loading = false;
      },
    });
  }

  loginWithOkta(): void {
    this.authService.loginWithOkta().subscribe();
  }
}
