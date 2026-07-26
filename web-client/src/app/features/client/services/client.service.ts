import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { UserResponse } from '../../auth/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private authService = inject(AuthService);

  public currentUser$: Observable<UserResponse | null> = this.authService.currentUser$;
}
