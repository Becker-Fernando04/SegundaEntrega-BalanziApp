import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    localStorage.removeItem('balanzi_lang');
    TestBed.configureTestingModule({
      providers: [LanguageService, provideZonelessChangeDetection()]
    });
    service = TestBed.inject(LanguageService);
  });

  it('uses the selected language for labels and localized financial terms', () => {
    expect(service.t.tabInicio).toBe('Inicio');

    service.cambiarIdioma('en');

    expect(service.t.tabInicio).toBe('Home');
    expect(service.traducirCategoria('Alimentación')).toBe('Food');
    expect(service.traducirMetodoPago('Tarjeta de Débito')).toBe('Debit card');
    expect(service.traducirDescripcion('Pago de Luz')).toBe('Electricity bill');
    expect(service.traducirDescripcion('Ahorro → Fondo de Emergencia')).toBe('Savings → Emergency Fund');
    expect(service.traducirDescripcion('A custom description')).toBe('A custom description');
    expect(service.traducirNombreMeta('Fondo de Emergencia')).toBe('Emergency Fund');
    expect(service.traducirPeriodo('Noviembre (Mes actual)')).toBe('November (Current month)');
    expect(service.traducirFecha('Hoy, 14:30')).toBe('Today, 14:30');
    expect(document.documentElement.lang).toBe('en');
  });

  it('preserves Spanish labels and financial terms when Spanish is selected', () => {
    service.cambiarIdioma('en');
    service.cambiarIdioma('es');

    expect(service.t.tabInicio).toBe('Inicio');
    expect(service.traducirCategoria('Alimentación')).toBe('Alimentación');
    expect(service.traducirMetodoPago('Tarjeta de Débito')).toBe('Tarjeta de Débito');
    expect(document.documentElement.lang).toBe('es');
  });
});
