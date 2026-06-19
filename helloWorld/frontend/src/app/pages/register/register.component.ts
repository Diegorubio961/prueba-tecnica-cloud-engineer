import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

function passwordMatch(control: AbstractControl) {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
  } else {
    confirm?.setErrors(null);
  }
  return null;
}

@Component({
  selector: 'app-register',
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
  ],
  template: `
    <div class="page">
      <div class="card">
        <div class="card-header">
          <a routerLink="/" class="logo">&#127760; HelloWorld</a>
          <h1>Crear cuenta</h1>
          <p>Únete en segundos y accede a tu Hello World</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
          <mat-form-field appearance="outline" class="field">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="name" placeholder="Tu nombre" autocomplete="name">
            <mat-icon matPrefix>person</mat-icon>
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <mat-error>El nombre es requerido</mat-error>
            }
          </mat-form-field>

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
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="new-password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.errors?.['minlength'] && form.get('password')?.touched) {
              <mat-error>Mínimo 6 caracteres</mat-error>
            }
            @if (form.get('password')?.errors?.['required'] && form.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Confirmar contraseña</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="confirmPassword" autocomplete="new-password">
            <mat-icon matPrefix>lock_outline</mat-icon>
            @if (form.get('confirmPassword')?.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
              <mat-error>Las contraseñas no coinciden</mat-error>
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
              Crear Cuenta
            }
          </button>
        </form>

        <p class="footer-link">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
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
      max-width: 440px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.2);
    }
    .card-header {
      text-align: center;
      margin-bottom: 1.75rem;
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
    .field { width: 100%; }
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
  `]
})
export class RegisterComponent {
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
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatch });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const name = this.form.get('name')?.value as string;
    const email = this.form.get('email')?.value as string;
    const password = this.form.get('password')?.value as string;
    this.authService.register(name, email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al registrarse. Intenta de nuevo.';
        this.loading = false;
      },
    });
  }
}
