import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { DatabaseService, Movimiento, BalanceGeneral } from '../services/database.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false,
})
export class InicioPage implements OnInit, OnDestroy {

  balance: BalanceGeneral = { balance: 0, ingresos: 0, gastos: 0 };
  movimientosRecientes: Movimiento[] = [];
  private subs: Subscription = new Subscription();

  constructor(
    private dbService: DatabaseService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.subs.add(
      this.dbService.isReady$.subscribe(ready => {
        if (ready) {
          this.cargarDatos();
        }
      })
    );

    this.subs.add(
      this.dbService.dataChanged$.subscribe(() => {
        this.cargarDatos();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    const bal = await this.dbService.getBalance();
    const movs = await this.dbService.getMovimientosRecientes(5);

    this.ngZone.run(() => {
      this.balance = bal;
      this.movimientosRecientes = movs;
      this.cdr.detectChanges();
    });
  }

}
