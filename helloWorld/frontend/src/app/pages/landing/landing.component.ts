import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="page">

      <nav class="navbar">
        <span class="brand">&#127760; HelloWorld</span>
        <div class="nav-links">
          <button mat-button routerLink="/login">Iniciar Sesión</button>
          <button mat-raised-button color="primary" routerLink="/register">Registrarse</button>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-text">
          <h1>Bienvenido a <span class="highlight">HelloWorld</span></h1>
          <p>Una plataforma segura, rápida y elegante para gestionar tu acceso.<br>Regístrate en segundos y descubre el mensaje que te espera.</p>
          <div class="hero-actions">
            <button mat-raised-button class="btn-cta" routerLink="/register">Comenzar Gratis</button>
            <button mat-stroked-button class="btn-outline" routerLink="/login">Ya tengo cuenta</button>
          </div>
        </div>
        <div class="hero-card">
          <div class="card-inner">
            <div class="wave">👋</div>
            <h2>Hello, World!</h2>
            <p>Tu mensaje te espera adentro</p>
            <div class="dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <h2>Por qué HelloWorld?</h2>
        <div class="grid">
          <div class="card">
            <div class="icon">&#128274;</div>
            <h3>Seguro</h3>
            <p>Autenticación JWT con contraseñas encriptadas mediante bcrypt</p>
          </div>
          <div class="card">
            <div class="icon">&#9889;</div>
            <h3>Rápido</h3>
            <p>Backend Node.js y Angular 17 optimizados para alto rendimiento</p>
          </div>
          <div class="card">
            <div class="icon">&#128241;</div>
            <h3>Responsivo</h3>
            <p>Diseño adaptable a cualquier dispositivo, de escritorio a móvil</p>
          </div>
          <div class="card">
            <div class="icon">&#128640;</div>
            <h3>Docker-Ready</h3>
            <p>Desplegable con un solo comando via Docker Compose</p>
          </div>
        </div>
      </section>

      <footer class="footer">
        <p>&#169; 2026 HelloWorld App · Construido con Angular 17 + Node.js</p>
      </footer>

    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    /* Navbar */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2.5rem;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      font-size: 1.4rem;
      font-weight: 800;
      color: #6366f1;
      letter-spacing: -0.5px;
    }
    .nav-links {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* Hero */
    .hero {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5rem;
      padding: 6rem 2.5rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
      flex: 1;
    }
    .hero-text {
      max-width: 560px;
      color: white;
    }
    .hero-text h1 {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 1.25rem;
      letter-spacing: -1px;
    }
    .highlight {
      background: linear-gradient(90deg, #fbbf24, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-text p {
      font-size: 1.15rem;
      line-height: 1.7;
      opacity: 0.9;
      margin-bottom: 2.5rem;
    }
    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .btn-cta {
      background: white !important;
      color: #6366f1 !important;
      font-weight: 700 !important;
      padding: 0.5rem 2rem !important;
      font-size: 1rem !important;
      border-radius: 8px !important;
    }
    .btn-outline {
      border-color: rgba(255,255,255,0.8) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 0.5rem 2rem !important;
      font-size: 1rem !important;
    }

    /* Floating card */
    .hero-card {
      flex-shrink: 0;
    }
    .card-inner {
      background: white;
      border-radius: 1.5rem;
      padding: 3rem 2.5rem;
      box-shadow: 0 30px 60px rgba(0,0,0,0.25);
      text-align: center;
      animation: float 3s ease-in-out infinite;
      min-width: 220px;
    }
    .wave {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      animation: wave 2s ease-in-out infinite;
      display: inline-block;
    }
    .card-inner h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .card-inner p {
      color: #64748b;
      font-size: 0.9rem;
    }
    .dots {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 1.25rem;
    }
    .dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6366f1;
      opacity: 0.3;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .dots span:nth-child(2) { animation-delay: 0.3s; }
    .dots span:nth-child(3) { animation-delay: 0.6s; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-15deg); }
      75% { transform: rotate(15deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }

    /* Features */
    .features {
      padding: 5rem 2.5rem;
      text-align: center;
      background: #f8fafc;
    }
    .features h2 {
      font-size: 2.25rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 3rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 1rem;
      padding: 2rem 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 32px rgba(99,102,241,0.15);
    }
    .icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .card p {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    /* Footer */
    .footer {
      background: #1e293b;
      color: #94a3b8;
      text-align: center;
      padding: 1.5rem 2rem;
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .hero {
        flex-direction: column;
        padding: 4rem 1.5rem;
        gap: 3rem;
        text-align: center;
      }
      .hero-text h1 { font-size: 2.5rem; }
      .hero-actions { justify-content: center; }
      .hero-card { display: none; }
    }
    @media (max-width: 600px) {
      .navbar { padding: 1rem 1.25rem; }
      .hero-text h1 { font-size: 2rem; }
      .nav-links button:first-child { display: none; }
    }
  `]
})
export class LandingComponent {}
