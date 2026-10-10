import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ContactSection } from '../../models/site-content';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

/**
 * Lets brands or people reach Lourdes. Messages are delivered to her inbox
 * through Web3Forms, so the site stays static with no backend of its own.
 */
@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contact {
  readonly contact = input.required<ContactSection>();

  private readonly http = inject(HttpClient);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly status = signal<SendStatus>('idle');
  protected readonly isConfigured = computed(() => !!this.contact().web3formsKey);
  protected readonly whatsappUrl = computed(() => {
    const digits = this.contact().whatsapp.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '';
  });

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    brand: [''],
    service: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
    botcheck: ['']
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || !this.isConfigured()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, brand, service, message, botcheck } = this.form.getRawValue();
    this.status.set('sending');

    try {
      await firstValueFrom(
        this.http.post(WEB3FORMS_URL, {
          access_key: this.contact().web3formsKey,
          subject: `Nuevo contacto desde el portafolio: ${brand || name}`,
          from_name: name,
          name,
          email,
          marca: brand,
          servicio: service,
          message,
          botcheck
        })
      );
      this.status.set('sent');
      this.form.reset();
    } catch {
      this.status.set('error');
    }
  }

  protected invalid(field: 'name' | 'email' | 'message'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }
}
