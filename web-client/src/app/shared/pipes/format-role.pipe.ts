import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforms internal role identifiers (e.g. BANK_ADMIN) into
 * human-readable labels (e.g. "Bank Admin") for display in the UI.
 * Internal code always uses the raw enum value; this pipe is
 * purely presentational and should never be used in logic/API calls.
 */
@Pipe({
  name: 'formatRole',
  standalone: true,
  pure: true
})
export class FormatRolePipe implements PipeTransform {
  transform(role: string | null | undefined): string {
    if (!role) {
      return '';
    }
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
