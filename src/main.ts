import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';
import { AppModule } from './app/app.module';

if (Capacitor.getPlatform() === 'web') {
  jeepSqlite(window);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
