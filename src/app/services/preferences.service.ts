import { Injectable } from '@angular/core';
import { WordService } from './word.service';
import {
  Preference,
  Preferences,
  Language,
  Theme,
  WordMode,
} from '../models/Preference';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private listeners: ((
    updatedPreference: Preference,
    value: any
  ) => void)[] = [];

  private defaults: Preferences = {
    theme: Theme.LIGHT,
    word_language: Language.ENGLISH,
    follow_system_theme: false,
    default_word_mode: WordMode.WORDS,
    reverse_scroll: false,
  };

  private preferencesSubjects = new Map<string, BehaviorSubject<any>>();

  constructor() {
    addEventListener('storage', this.onStorage.bind(this), false);

    this.retrievePreferences();
  }

  private retrievePreferences() {
    try {
      // Set default preferences
      for (let defaultPreference in this.defaults) {
        this.preferencesSubjects.set(
          defaultPreference,
          new BehaviorSubject(this.defaults[defaultPreference])
        );
      }

      let preferences = JSON.parse(localStorage.getItem('preferences'));
      if (typeof preferences === 'undefined') throw null;

      for (let preference in preferences) {
        this.preferencesSubjects.get(preference).next(preferences[preference]);
      }
    } catch (e) {}
  }

  getPreferences(): Map<string, BehaviorSubject<any>> {
    return new Map(this.preferencesSubjects);
  }

  getPreference(key: Preference): any {
    try {
      let preference = JSON.parse(localStorage.getItem('preferences'))[key];
      if (typeof preference === 'undefined') throw null;
      return preference;
    } catch (e) {
      return this.defaults[key];
    }
  }

  setPreference(key: Preference, value: any) {
    // Retrieve preferences object
    let pref: Preferences;

    try {
      pref = JSON.parse(localStorage.getItem('preferences'));
      if (pref == null || typeof pref === 'undefined') throw null;
    } catch (e) {
      pref = {};
    }

    pref[key as string] = value;

    localStorage.setItem('preferences', JSON.stringify(pref));
    this.notifySubscribers(key, value);
    this.preferencesSubjects.get(key).next(value);
  }

  addListener(
    listener: (updatedPreference: Preference, peferenceValue: any) => void
  ) {
    if (listener) {
      this.listeners.push(listener);
    }
  }

  private onStorage(event: StorageEvent) {
    if (event.key == 'preferences') {
      try {
        let oldObj: Preferences = JSON.parse(event.oldValue);
        let newObj: Preferences = JSON.parse(event.newValue);

        Object.keys(this.defaults).forEach((key) => {
          if (oldObj[key] !== newObj[key]) {
            this.preferencesSubjects[key].next(newObj[key]);
            this.notifySubscribers(key as Preference, newObj[key]);
          }
        });
      } catch (e) {}
    }
  }

  private notifySubscribers(updatedPreference: Preference, value: any) {
    this.listeners.forEach((listener) => {
      listener(updatedPreference, value);
    });
  }
}
